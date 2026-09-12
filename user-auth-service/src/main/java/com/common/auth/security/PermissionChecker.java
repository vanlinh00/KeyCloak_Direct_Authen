package com.common.auth.security;

import com.common.auth.service.PermissionCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Custom Method Security Evaluator for Fine-Grained Authorization (FGA).
 * Intercepts method execution expressions such as:
 * {@code @PreAuthorize("@permissionChecker.hasPermission('invoice:export-pdf')")}
 */
@Component("permissionChecker")
@RequiredArgsConstructor
@Slf4j
public class PermissionChecker {

    private final PermissionCacheService permissionCacheService;

    /**
     * Checks if the currently authenticated user possesses the required fine-grained permission.
     *
     * @param permissionCode required permission action code (e.g. "invoice:export-pdf")
     * @return true if allowed; false will trigger Spring Security AccessDeniedException (HTTP 403)
     */
    public boolean hasPermission(String permissionCode) {
        if (permissionCode == null || permissionCode.isBlank()) {
            return false;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null 
                || !authentication.isAuthenticated() 
                || authentication instanceof AnonymousAuthenticationToken) {
            log.warn("Permission check failed: User is unauthenticated");
            return false;
        }

        Set<String> roles = extractRoles(authentication);
        if (roles.isEmpty()) {
            log.warn("User '{}' has no assigned roles in authentication context", authentication.getName());
            return false;
        }

        // Check if user has global super-admin role
        if (roles.contains("ADMIN")) {
            log.debug("Granting permission '{}' due to 'ADMIN' super-role", permissionCode);
            return true;
        }

        // Query Redis Cache layer (SUNION across all roles)
        Set<String> effectivePermissions = permissionCacheService.getPermissionsForRoles(new ArrayList<>(roles));
        String targetPermission = permissionCode.trim().toLowerCase();

        boolean granted = effectivePermissions.contains(targetPermission) || effectivePermissions.contains("*");

        if (!granted) {
            log.warn("Access denied for user '{}' with roles {}. Required permission: '{}'. User permissions: {}",
                    authentication.getName(), roles, targetPermission, effectivePermissions);
        } else {
            log.debug("Access granted for user '{}'. Permission '{}' matched.",
                    authentication.getName(), targetPermission);
        }

        return granted;
    }

    /**
     * Checks if the current user possesses ANY of the specified permissions.
     */
    public boolean hasAnyPermission(String... permissionCodes) {
        if (permissionCodes == null || permissionCodes.length == 0) {
            return false;
        }
        return Arrays.stream(permissionCodes).anyMatch(this::hasPermission);
    }

    /**
     * Checks if the current user possesses ALL of the specified permissions.
     */
    public boolean hasAllPermissions(String... permissionCodes) {
        if (permissionCodes == null || permissionCodes.length == 0) {
            return false;
        }
        return Arrays.stream(permissionCodes).allMatch(this::hasPermission);
    }

    /**
     * Intercepts Authentication and extracts high-level Keycloak roles from:
     * 1. JWT 'realm_access.roles'
     * 2. JWT 'resource_access.*.roles'
     * 3. GrantedAuthority objects (with or without 'ROLE_' prefix)
     */
    public Set<String> extractRoles(Authentication authentication) {
        Set<String> roles = new HashSet<>();

        // 1. Extract from JWT claims if available
        Jwt jwt = null;
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            jwt = jwtAuth.getToken();
        } else if (authentication.getPrincipal() instanceof Jwt principalJwt) {
            jwt = principalJwt;
        }

        if (jwt != null) {
            // Extract from realm_access
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> realmRoles) {
                for (Object roleObj : realmRoles) {
                    if (roleObj != null) {
                        roles.add(roleObj.toString().trim().toUpperCase());
                    }
                }
            }

            // Extract from resource_access (all client roles)
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                for (Object clientEntry : resourceAccess.values()) {
                    if (clientEntry instanceof Map<?, ?> clientMap && clientMap.get("roles") instanceof Collection<?> clientRoles) {
                        for (Object roleObj : clientRoles) {
                            if (roleObj != null) {
                                roles.add(roleObj.toString().trim().toUpperCase());
                            }
                        }
                    }
                }
            }
        }

        // 2. Extract from Spring Security GrantedAuthorities
        if (authentication.getAuthorities() != null) {
            for (GrantedAuthority authority : authentication.getAuthorities()) {
                String authStr = authority.getAuthority();
                if (authStr != null && !authStr.isBlank()) {
                    if (authStr.startsWith("ROLE_")) {
                        roles.add(authStr.substring(5).trim().toUpperCase());
                    } else {
                        roles.add(authStr.trim().toUpperCase());
                    }
                }
            }
        }

        return roles;
    }
}
