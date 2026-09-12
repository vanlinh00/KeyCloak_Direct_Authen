package com.common.auth.service;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;

/**
 * Strategy interface for resolving fine-grained permissions when a Redis cache miss occurs
 * or when Redis is temporarily unavailable.
 * <p>
 * Microservices with direct database access (like user-auth-service) provide an implementation
 * (e.g. querying PostgreSQL), while pure consumer microservices (like invoice-service) can rely
 * exclusively on Redis or an internal HTTP fallback client.
 */
@FunctionalInterface
public interface PermissionFallbackProvider {

    /**
     * Fetches fine-grained permission action codes for the given role names.
     *
     * @param roleNames collection of normalized role names (e.g. ["ADMIN", "MANAGER"])
     * @return Set of fine-grained permission codes (e.g. ["invoice:export-pdf", "user:read"])
     */
    Set<String> getPermissionsForRoles(Collection<String> roleNames);

    /**
     * Convenience method to fetch permissions for a single role.
     *
     * @param roleName normalized role name
     * @return Set of permission codes
     */
    default Set<String> getPermissionsForRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return Collections.emptySet();
        }
        return getPermissionsForRoles(Collections.singletonList(roleName));
    }
}
