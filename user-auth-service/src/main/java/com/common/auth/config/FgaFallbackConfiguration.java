package com.common.auth.config;

import com.common.auth.repository.PermissionRepository;
import com.common.auth.service.PermissionFallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Connects user-auth-service's PostgreSQL PermissionRepository to the shared
 * common-auth-library PermissionCacheService as a fallback query provider.
 */
@Configuration
public class FgaFallbackConfiguration {

    @Bean
    public PermissionFallbackProvider permissionFallbackProvider(PermissionRepository permissionRepository) {
        return permissionRepository::findCodesByRoleNames;
    }
}
