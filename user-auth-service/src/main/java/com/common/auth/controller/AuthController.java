package com.common.auth.controller;

import com.common.auth.dto.request.LoginRequest;
import com.common.auth.dto.request.LogoutRequest;
import com.common.auth.dto.request.RefreshTokenRequest;
import com.common.auth.dto.response.ApiResponse;
import com.common.auth.dto.response.TokenResponse;
import com.common.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication Management", description = "Endpoints for OAuth2/OIDC Token generation, refreshing, and session revocation via Keycloak")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Authenticates user against Keycloak token endpoint via Direct Access Grant and issues access/refresh tokens.")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received login request for username: {}", request.getLoginId());
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", tokenResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Exchanges an active refresh token for a newly issued access token.")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Received token refresh request");
        TokenResponse tokenResponse = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", tokenResponse));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke user session", description = "Invalidates the user refresh token and active session in Keycloak.")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody LogoutRequest request) {
        log.info("Received session logout request");
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Session revoked successfully", null));
    }
}
