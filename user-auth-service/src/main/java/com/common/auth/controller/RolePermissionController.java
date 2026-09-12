package com.common.auth.controller;

import com.common.auth.dto.request.AssignPermissionsRequest;
import com.common.auth.dto.request.CreatePermissionRequest;
import com.common.auth.dto.request.CreateRoleRequest;
import com.common.auth.dto.response.ApiResponse;
import com.common.auth.dto.response.PermissionResponse;
import com.common.auth.dto.response.RoleResponse;
import com.common.auth.security.PermissionChecker;
import com.common.auth.security.SecurityUtils;
import com.common.auth.service.PermissionCacheService;
import com.common.auth.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Role & Permission Management (FGA)", description = "Fine-Grained Authorization management: DB persistence + Redis Cache sync")
@SecurityRequirement(name = "KeycloakBearerAuth")
public class RolePermissionController {

    private final PermissionService permissionService;
    private final PermissionCacheService permissionCacheService;
    private final PermissionChecker permissionChecker;
    private final SecurityUtils securityUtils;

    // ==========================================
    // 1. Roles Management
    // ==========================================

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN') or @permissionChecker.hasPermission('role:read')")
    @Operation(summary = "List all roles", description = "Retrieves all registered roles and their assigned permission codes.")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        log.info("Fetching all roles");
        List<RoleResponse> roles = permissionService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success("Roles fetched successfully", roles));
    }

    @GetMapping("/roles/{roleName}")
    @PreAuthorize("hasRole('ADMIN') or @permissionChecker.hasPermission('role:read')")
    @Operation(summary = "Get role by name", description = "Retrieves a specific role and its assigned permissions.")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleByName(@PathVariable String roleName) {
        log.info("Fetching role: {}", roleName);
        RoleResponse role = permissionService.getRoleByName(roleName);
        return ResponseEntity.ok(ApiResponse.success("Role fetched successfully", role));
    }

    @PostMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new role", description = "Registers a new role matching Keycloak realm/client roles.")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody CreateRoleRequest request) {
        log.info("Creating new role: {}", request.getName());
        RoleResponse role = permissionService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Role created successfully", role));
    }

    // ==========================================
    // 2. Permissions Management
    // ==========================================

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('ADMIN') or @permissionChecker.hasPermission('permission:read')")
    @Operation(summary = "List all permissions", description = "Lists all fine-grained action permissions registered in the system.")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        log.info("Fetching all permissions");
        List<PermissionResponse> permissions = permissionService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success("Permissions fetched successfully", permissions));
    }

    @PostMapping("/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create fine-grained permission", description = "Registers a custom action permission code (e.g. invoice:export-pdf).")
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        log.info("Creating new permission code: {}", request.getCode());
        PermissionResponse permission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Permission created successfully", permission));
    }

    // ==========================================
    // 3. Role-Permission Mapping Operations
    // ==========================================

    @PostMapping("/roles/{roleName}/permissions")
    @PreAuthorize("hasRole('ADMIN') or @permissionChecker.hasPermission('role:assign-permission')")
    @Operation(summary = "Assign permissions to role", description = "Appends permission codes to a role and invalidates Redis cache.")
    public ResponseEntity<ApiResponse<RoleResponse>> assignPermissions(
            @PathVariable String roleName,
            @Valid @RequestBody AssignPermissionsRequest request) {
        log.info("Assigning permissions {} to role: {}", request.getPermissionCodes(), roleName);
        RoleResponse updatedRole = permissionService.assignPermissionsToRole(roleName, request.getPermissionCodes());
        return ResponseEntity.ok(ApiResponse.success("Permissions assigned successfully and Redis cache invalidated", updatedRole));
    }

    @DeleteMapping("/roles/{roleName}/permissions")
    @PreAuthorize("hasRole('ADMIN') or @permissionChecker.hasPermission('role:assign-permission')")
    @Operation(summary = "Remove permissions from role", description = "Removes permission codes from a role and invalidates Redis cache.")
    public ResponseEntity<ApiResponse<RoleResponse>> removePermissions(
            @PathVariable String roleName,
            @Valid @RequestBody AssignPermissionsRequest request) {
        log.info("Removing permissions {} from role: {}", request.getPermissionCodes(), roleName);
        RoleResponse updatedRole = permissionService.removePermissionsFromRole(roleName, request.getPermissionCodes());
        return ResponseEntity.ok(ApiResponse.success("Permissions removed successfully and Redis cache invalidated", updatedRole));
    }

    @PutMapping("/roles/{roleName}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Overwrite all permissions for role", description = "Sets exact permission set for a role and invalidates Redis cache.")
    public ResponseEntity<ApiResponse<RoleResponse>> setPermissions(
            @PathVariable String roleName,
            @Valid @RequestBody AssignPermissionsRequest request) {
        log.info("Overwriting permissions for role '{}' with: {}", roleName, request.getPermissionCodes());
        RoleResponse updatedRole = permissionService.setRolePermissions(roleName, request.getPermissionCodes());
        return ResponseEntity.ok(ApiResponse.success("Role permissions updated successfully and Redis cache invalidated", updatedRole));
    }

    @PostMapping("/roles/{roleName}/cache/invalidate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Explicitly invalidate role Redis cache", description = "Manually flushes the Redis cache Set for a specific role.")
    public ResponseEntity<ApiResponse<Void>> invalidateRoleCache(@PathVariable String roleName) {
        log.info("Manually invalidating Redis cache for role: {}", roleName);
        permissionCacheService.invalidateRoleCache(roleName);
        return ResponseEntity.ok(ApiResponse.success("Redis cache invalidated for role: " + roleName, null));
    }

    // ==========================================
    // 4. Current User Effective Permissions (Self-Inspection)
    // ==========================================

    @GetMapping("/my-permissions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user's effective permissions", description = "Aggregates fine-grained permissions for all current user roles via Redis SUNION.")
    public ResponseEntity<ApiResponse<Set<String>>> getMyPermissions() {
        Authentication authentication = securityUtils.getAuthentication();
        Set<String> roles = permissionChecker.extractRoles(authentication);
        Set<String> effectivePermissions = permissionCacheService.getPermissionsForRoles(new ArrayList<>(roles));
        return ResponseEntity.ok(ApiResponse.success("Effective permissions fetched successfully", effectivePermissions));
    }
}
