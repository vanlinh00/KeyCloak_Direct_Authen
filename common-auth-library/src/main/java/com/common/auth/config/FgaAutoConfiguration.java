package com.common.auth.config;

import com.common.auth.security.PermissionChecker;
import com.common.auth.service.PermissionCacheService;
import com.common.auth.service.PermissionFallbackProvider;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Spring Boot 3 Auto-Configuration for Fine-Grained Authorization (FGA).
 * Automatically registers StringRedisTemplate, PermissionCacheService, and PermissionChecker
 * beans into consuming microservices without requiring explicit @ComponentScan declarations.
 */
@AutoConfiguration
@ConditionalOnClass({StringRedisTemplate.class, PermissionChecker.class})
public class FgaAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }

    @Bean
    @ConditionalOnMissingBean
    public PermissionCacheService permissionCacheService(
            StringRedisTemplate stringRedisTemplate,
            ObjectProvider<PermissionFallbackProvider> fallbackProvider) {
        return new PermissionCacheService(stringRedisTemplate, fallbackProvider.getIfAvailable());
    }

    @Bean("permissionChecker")
    @ConditionalOnMissingBean(name = "permissionChecker")
    public PermissionChecker permissionChecker(PermissionCacheService permissionCacheService) {
        return new PermissionChecker(permissionCacheService);
    }
}
