package com.common.auth.service;

import com.common.auth.dto.request.CreatePermissionRequest;
import com.common.auth.dto.request.CreateRoleRequest;
import com.common.auth.dto.response.PermissionResponse;
import com.common.auth.dto.response.RoleResponse;
import com.common.auth.entity.Permission;
import com.common.auth.entity.Role;
import com.common.auth.exception.ResourceNotFoundException;
import com.common.auth.exception.UserAlreadyExistsException;
import com.common.auth.repository.PermissionRepository;
import com.common.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionCacheService permissionCacheService;

    /**
     * Lists all registered system roles with their assigned fine-grained permission codes.
     */
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToRoleResponse)
                .toList();
    }

    /**
     * Retrieves a single role by its unique name with permissions.
     */
    @Transactional(readOnly = true)
    public RoleResponse getRoleByName(String roleName) {
        String normalizedName = roleName.trim().toUpperCase();
        Role role = roleRepository.findByNameWithPermissions(normalizedName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + normalizedName));
        return mapToRoleResponse(role);
    }

    /**
     * Lists all registered fine-grained action permissions.
     */
    @Transactional(readOnly = true)
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::mapToPermissionResponse)
                .toList();
    }

    /**
     * Creates a new fine-grained action permission (e.g. "invoice:export-pdf").
     */
    @Transactional
    public PermissionResponse createPermission(CreatePermissionRequest request) {
        String code = request.getCode().trim().toLowerCase();
        if (permissionRepository.existsByCode(code)) {
            throw new UserAlreadyExistsException("Permission code '" + code + "' already exists");
        }

        Permission permission = Permission.builder()
                .code(code)
                .module(request.getModule().trim().toLowerCase())
                .description(request.getDescription())
                .build();

        Permission saved = permissionRepository.save(permission);
        log.info("Created new fine-grained permission: {}", saved.getCode());
        return mapToPermissionResponse(saved);
    }

    /**
     * Creates a new role matching Keycloak realm/client roles and assigns initial permissions if provided.
     */
    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        String roleName = request.getName().trim().toUpperCase();
        if (roleRepository.existsByName(roleName)) {
            throw new UserAlreadyExistsException("Role '" + roleName + "' already exists");
        }

        Role role = Role.builder()
                .name(roleName)
                .description(request.getDescription())
                .permissions(new HashSet<>())
                .build();

        if (request.getPermissionCodes() != null && !request.getPermissionCodes().isEmpty()) {
            List<Permission> permissions = permissionRepository.findByCodeIn(request.getPermissionCodes());
            permissions.forEach(role::addPermission);
        }

        Role saved = roleRepository.save(role);
        permissionCacheService.invalidateRoleCache(roleName);
        log.info("Created new role '{}' with {} permissions", roleName, saved.getPermissions().size());
        return mapToRoleResponse(saved);
    }

    /**
     * Assigns one or more fine-grained permissions to a role.
     * Automatically invalidates the Redis role cache to ensure immediate consistency.
     */
    @Transactional
    public RoleResponse assignPermissionsToRole(String roleName, Set<String> permissionCodes) {
        String normalizedName = roleName.trim().toUpperCase();
        Role role = roleRepository.findByNameWithPermissions(normalizedName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + normalizedName));

        List<Permission> toAssign = permissionRepository.findByCodeIn(permissionCodes);
        if (toAssign.isEmpty()) {
            throw new ResourceNotFoundException("None of the specified permission codes exist in the database");
        }

        toAssign.forEach(role::addPermission);
        Role saved = roleRepository.save(role);

        // Invalidate Redis cache
        permissionCacheService.invalidateRoleCache(normalizedName);
        log.info("Assigned {} permissions to role '{}'. Cache invalidated.", toAssign.size(), normalizedName);

        return mapToRoleResponse(saved);
    }

    /**
     * Removes one or more fine-grained permissions from a role.
     * Automatically invalidates the Redis role cache.
     */
    @Transactional
    public RoleResponse removePermissionsFromRole(String roleName, Set<String> permissionCodes) {
        String normalizedName = roleName.trim().toUpperCase();
        Role role = roleRepository.findByNameWithPermissions(normalizedName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + normalizedName));

        Set<String> normalizedCodes = permissionCodes.stream()
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Set<Permission> toRemove = role.getPermissions().stream()
                .filter(p -> normalizedCodes.contains(p.getCode().toLowerCase()))
                .collect(Collectors.toSet());

        toRemove.forEach(role::removePermission);
        Role saved = roleRepository.save(role);

        // Invalidate Redis cache
        permissionCacheService.invalidateRoleCache(normalizedName);
        log.info("Removed {} permissions from role '{}'. Cache invalidated.", toRemove.size(), normalizedName);

        return mapToRoleResponse(saved);
    }

    /**
     * Overwrites all permissions of a role with the provided set.
     * Automatically invalidates the Redis role cache.
     */
    @Transactional
    public RoleResponse setRolePermissions(String roleName, Set<String> permissionCodes) {
        String normalizedName = roleName.trim().toUpperCase();
        Role role = roleRepository.findByNameWithPermissions(normalizedName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + normalizedName));

        // Clear existing associations
        role.getPermissions().clear();

        if (permissionCodes != null && !permissionCodes.isEmpty()) {
            List<Permission> newPermissions = permissionRepository.findByCodeIn(permissionCodes);
            newPermissions.forEach(role::addPermission);
        }

        Role saved = roleRepository.save(role);
        permissionCacheService.invalidateRoleCache(normalizedName);
        log.info("Reset permissions for role '{}'. Total now: {}. Cache invalidated.",
                normalizedName, saved.getPermissions().size());

        return mapToRoleResponse(saved);
    }

    private RoleResponse mapToRoleResponse(Role role) {
        Set<String> permCodes = role.getPermissions() != null
                ? role.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet())
                : new HashSet<>();

        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(permCodes)
                .createdAt(role.getCreatedAt())
                .build();
    }

    private PermissionResponse mapToPermissionResponse(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .code(permission.getCode())
                .module(permission.getModule())
                .description(permission.getDescription())
                .createdAt(permission.getCreatedAt())
                .build();
    }
}
