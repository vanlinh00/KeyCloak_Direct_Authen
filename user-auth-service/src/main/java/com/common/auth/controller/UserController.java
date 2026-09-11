package com.common.auth.controller;

import com.common.auth.dto.request.RegisterRequest;
import com.common.auth.dto.request.UpdateProfileRequest;
import com.common.auth.dto.response.ApiResponse;
import com.common.auth.dto.response.UserProfileResponse;
import com.common.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management", description = "Endpoints for dual-store user onboarding and profile lifecycle management")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @Operation(
            summary = "Register a new user identity & domain profile",
            description = "Creates identity records in Keycloak IAM and domain data in PostgreSQL mydb.user_profiles under the same UUID."
    )
    public ResponseEntity<ApiResponse<UserProfileResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received user registration request for loginId: {}", request.getLoginId());
        UserProfileResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully across Keycloak and PostgreSQL", response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Get current authenticated user profile",
            description = "Combines standard JWT claims (sub, email, preferred_username, roles) with extended domain fields from PostgreSQL mydb.user_profiles.",
            security = @SecurityRequirement(name = "KeycloakBearerAuth")
    )
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMe() {
        log.info("GET /me requested for current authenticated user");
        UserProfileResponse response = userService.getMe();
        return ResponseEntity.ok(ApiResponse.success("User profile fetched successfully", response));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Update current user domain profile",
            description = "Updates domain profile records in PostgreSQL mydb.user_profiles for the authenticated user.",
            security = @SecurityRequirement(name = "KeycloakBearerAuth")
    )
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMe(
            @Valid @RequestBody UpdateProfileRequest request) {
        log.info("PUT /me requested for current authenticated user");
        UserProfileResponse response = userService.updateMe(request);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully in PostgreSQL", response));
    }
}
