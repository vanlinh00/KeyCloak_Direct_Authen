package com.common.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * High-performance Redis caching layer for Fine-Grained Authorization (FGA).
 * Stores role-to-permission mappings as Redis Sets with 24-hour TTL and evaluates permissions
 * using server-side O(1) SUNION aggregations across user roles.
 */
@Slf4j
public class PermissionCacheService {

    public static final String KEY_PREFIX = "role:permissions:";
    public static final String EMPTY_SENTINEL = "__EMPTY__";
    public static final Duration DEFAULT_CACHE_TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;
    private final PermissionFallbackProvider fallbackProvider;
    private final Duration cacheTtl;

    public PermissionCacheService(StringRedisTemplate redisTemplate) {
        this(redisTemplate, null, DEFAULT_CACHE_TTL);
    }

    public PermissionCacheService(StringRedisTemplate redisTemplate, PermissionFallbackProvider fallbackProvider) {
        this(redisTemplate, fallbackProvider, DEFAULT_CACHE_TTL);
    }

    public PermissionCacheService(StringRedisTemplate redisTemplate, 
                                  PermissionFallbackProvider fallbackProvider, 
                                  Duration cacheTtl) {
        this.redisTemplate = redisTemplate;
        this.fallbackProvider = fallbackProvider;
        this.cacheTtl = cacheTtl != null ? cacheTtl : DEFAULT_CACHE_TTL;
    }

    /**
     * Builds the standard Redis key format: role:permissions:{role_name}
     */
    public String buildKey(String roleName) {
        return KEY_PREFIX + roleName.trim().toUpperCase();
    }

    /**
     * Retrieves aggregated permissions for a collection of roles using Redis SUNION.
     * On cache miss for any role, attempts to populate from the fallback provider if configured.
     *
     * @param roleNames list of high-level user roles (e.g. ["ADMIN", "MANAGER"])
     * @return Set of fine-grained permission action codes (e.g. ["invoice:export-pdf", "user:delete"])
     */
    public Set<String> getPermissionsForRoles(List<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return Collections.emptySet();
        }

        // Normalize roles: uppercase, trim whitespace
        List<String> normalizedRoles = roleNames.stream()
                .filter(r -> r != null && !r.isBlank())
                .map(r -> r.trim().toUpperCase())
                .distinct()
                .toList();

        if (normalizedRoles.isEmpty()) {
            return Collections.emptySet();
        }

        try {
            List<String> keysToUnion = new ArrayList<>();

            for (String role : normalizedRoles) {
                String key = buildKey(role);
                Boolean keyExists = redisTemplate.hasKey(key);

                if (Boolean.FALSE.equals(keyExists)) {
                    log.debug("Redis cache miss for role '{}'", role);
                    if (fallbackProvider != null) {
                        populateRoleCacheFromFallback(role);
                    }
                }
                keysToUnion.add(key);
            }

            if (keysToUnion.isEmpty()) {
                return Collections.emptySet();
            }

            Set<String> rawResult;
            if (keysToUnion.size() == 1) {
                rawResult = redisTemplate.opsForSet().members(keysToUnion.get(0));
            } else {
                String firstKey = keysToUnion.get(0);
                List<String> otherKeys = keysToUnion.subList(1, keysToUnion.size());
                rawResult = redisTemplate.opsForSet().union(firstKey, otherKeys);
            }

            if (rawResult == null || rawResult.isEmpty()) {
                if (fallbackProvider != null) {
                    log.debug("No permissions found in Redis for roles {}, querying fallback provider", normalizedRoles);
                    return fallbackProvider.getPermissionsForRoles(normalizedRoles);
                }
                return Collections.emptySet();
            }

            // Filter out empty sentinels
            return rawResult.stream()
                    .filter(p -> !EMPTY_SENTINEL.equals(p))
                    .collect(Collectors.toSet());

        } catch (Exception ex) {
            log.warn("Redis operation failed while resolving permissions for roles {}: {}. Attempting fallback provider.",
                    normalizedRoles, ex.getMessage());
            if (fallbackProvider != null) {
                try {
                    return fallbackProvider.getPermissionsForRoles(normalizedRoles);
                } catch (Exception fallbackEx) {
                    log.error("Permission fallback provider query failed: {}", fallbackEx.getMessage(), fallbackEx);
                }
            }
            return Collections.emptySet();
        }
    }

    /**
     * Populates the Redis cache Set for a specific role with the given permissions and a 24-hour TTL.
     *
     * @param roleName role name in uppercase
     * @param permissions collection of permission action codes
     */
    public void populateRoleCache(String roleName, Collection<String> permissions) {
        if (roleName == null || roleName.isBlank()) {
            return;
        }
        String normalizedRole = roleName.trim().toUpperCase();
        String key = buildKey(normalizedRole);

        try {
            // Delete key first to avoid stale entries
            redisTemplate.delete(key);

            if (permissions != null && !permissions.isEmpty()) {
                redisTemplate.opsForSet().add(key, permissions.toArray(new String[0]));
            } else {
                // Store sentinel to prevent cache penetration
                redisTemplate.opsForSet().add(key, EMPTY_SENTINEL);
            }
            redisTemplate.expire(key, cacheTtl);
            log.debug("Populated Redis cache for role '{}' with {} permissions, TTL={}",
                    normalizedRole, permissions != null ? permissions.size() : 0, cacheTtl);
        } catch (Exception ex) {
            log.warn("Failed to write permissions for role '{}' into Redis: {}", normalizedRole, ex.getMessage());
        }
    }

    private void populateRoleCacheFromFallback(String roleName) {
        if (fallbackProvider == null) {
            return;
        }
        try {
            Set<String> perms = fallbackProvider.getPermissionsForRole(roleName);
            populateRoleCache(roleName, perms);
        } catch (Exception e) {
            log.warn("Failed to load permissions from fallback provider for role '{}': {}", roleName, e.getMessage());
        }
    }

    /**
     * Invalidates the Redis cache key for the given role upon role permission updates.
     *
     * @param roleName role name to invalidate
     */
    public void invalidateRoleCache(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return;
        }
        try {
            String key = buildKey(roleName);
            Boolean deleted = redisTemplate.delete(key);
            log.info("Invalidated Redis role-permissions cache for key '{}' (result: {})", key, deleted);
        } catch (Exception ex) {
            log.warn("Failed to invalidate Redis cache for role '{}': {}", roleName, ex.getMessage());
        }
    }

    /**
     * Invalidates all role-permission cache keys in Redis.
     */
    public void invalidateAllCaches() {
        try {
            Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Invalidated all {} role-permission keys from Redis cache", keys.size());
            }
        } catch (Exception ex) {
            log.warn("Failed to invalidate all role cache keys: {}", ex.getMessage());
        }
    }
}
