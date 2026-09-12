package com.common.auth.service;

import com.common.auth.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

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
 * Stores role-to-permission mappings as Redis Sets with 24-hour TTL and SUNION aggregations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionCacheService {

    private static final String KEY_PREFIX = "role:permissions:";
    private static final String EMPTY_SENTINEL = "__EMPTY__";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;
    private final PermissionRepository permissionRepository;

    /**
     * Builds the standard Redis key format: role:permissions:{role_name}
     */
    public String buildKey(String roleName) {
        return KEY_PREFIX + roleName.trim().toUpperCase();
    }

    /**
     * Retrieves aggregated permissions for a collection of roles using Redis SUNION.
     * On cache miss for any role, fetches from the database, caches to Redis, and unions.
     *
     * @param roleNames list of high-level user roles (e.g. ["ADMIN", "MANAGER"])
     * @return Set of fine-grained permission action codes (e.g. ["invoice:export-pdf", "user:delete"])
     */
    public Set<String> getPermissionsForRoles(List<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return Collections.emptySet();
        }

        // Normalize roles: uppercase, remove leading/trailing whitespace
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
                    // Cache Miss: populate this role from PostgreSQL
                    log.debug("Redis cache miss for role '{}', querying database", role);
                    populateRoleCache(role);
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
                return Collections.emptySet();
            }

            // Filter out empty sentinels
            return rawResult.stream()
                    .filter(p -> !EMPTY_SENTINEL.equals(p))
                    .collect(Collectors.toSet());

        } catch (Exception ex) {
            log.warn("Redis operation failed while resolving permissions for roles {}: {}. Falling back to PostgreSQL DB query.",
                    normalizedRoles, ex.getMessage());
            return permissionRepository.findCodesByRoleNames(normalizedRoles);
        }
    }

    /**
     * Populates the Redis cache Set for a specific role with a 24-hour TTL.
     *
     * @param roleName role name in uppercase
     * @return the set of permissions populated in Redis
     */
    public Set<String> populateRoleCache(String roleName) {
        String key = buildKey(roleName);
        Set<String> permissions = permissionRepository.findCodesByRoleName(roleName);

        try {
            // Clear existing key before refreshing
            redisTemplate.delete(key);

            if (permissions != null && !permissions.isEmpty()) {
                redisTemplate.opsForSet().add(key, permissions.toArray(new String[0]));
            } else {
                // Store sentinel to prevent cache penetration
                redisTemplate.opsForSet().add(key, EMPTY_SENTINEL);
            }
            redisTemplate.expire(key, CACHE_TTL);
            log.debug("Populated Redis cache for role '{}' with {} permissions, TTL={}",
                    roleName, permissions != null ? permissions.size() : 0, CACHE_TTL);
        } catch (Exception ex) {
            log.warn("Failed to write permissions for role '{}' into Redis: {}", roleName, ex.getMessage());
        }

        return permissions != null ? permissions : Collections.emptySet();
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
