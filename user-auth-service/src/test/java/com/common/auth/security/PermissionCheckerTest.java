package com.common.auth.security;

import com.common.auth.service.PermissionCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionCheckerTest {

    @Mock
    private PermissionCacheService permissionCacheService;

    @Mock
    private SecurityContext securityContext;

    private PermissionChecker permissionChecker;

    @BeforeEach
    void setUp() {
        permissionChecker = new PermissionChecker(permissionCacheService);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testHasPermission_AdminRole_AlwaysGranted() {
        Jwt jwt = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("sub", "user-123")
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        Authentication auth = new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        when(securityContext.getAuthentication()).thenReturn(auth);

        assertTrue(permissionChecker.hasPermission("invoice:export-pdf"));
        assertTrue(permissionChecker.hasPermission("user:delete"));
    }

    @Test
    void testHasPermission_ManagerRole_GrantedWhenInCache() {
        Jwt jwt = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("sub", "manager-456")
                .claim("realm_access", Map.of("roles", List.of("MANAGER")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        Authentication auth = new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
        when(securityContext.getAuthentication()).thenReturn(auth);
        when(permissionCacheService.getPermissionsForRoles(anyList()))
                .thenReturn(Set.of("invoice:read", "invoice:export-pdf"));

        assertTrue(permissionChecker.hasPermission("invoice:export-pdf"));
        assertFalse(permissionChecker.hasPermission("user:delete"));
    }

    @Test
    void testHasPermission_Unauthenticated_ReturnsFalse() {
        when(securityContext.getAuthentication()).thenReturn(null);
        assertFalse(permissionChecker.hasPermission("invoice:export-pdf"));
    }
}
