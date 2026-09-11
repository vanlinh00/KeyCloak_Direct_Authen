package com.common.auth.service;

import com.common.auth.config.KeycloakAdminConfig;
import com.common.auth.dto.request.LoginRequest;
import com.common.auth.dto.request.LogoutRequest;
import com.common.auth.dto.request.RefreshTokenRequest;
import com.common.auth.dto.response.TokenResponse;
import com.common.auth.exception.KeycloakIntegrationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final KeycloakAdminConfig keycloakConfig;
    private final RestClient restClient = RestClient.builder().build();

    /**
     * Authenticates the user via Keycloak Direct Access Grant (Resource Owner Password Credentials flow)
     * POST {auth-server-url}/realms/{realm}/protocol/openid-connect/token
     */
    public TokenResponse login(LoginRequest request) {
        String tokenUrl = getTokenEndpointUrl();
        log.info("Initiating Keycloak login for username: {} at {}", request.getLoginId(), tokenUrl);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", keycloakConfig.getClientId());
        if (keycloakConfig.getClientSecret() != null && !keycloakConfig.getClientSecret().isBlank()) {
            formData.add("client_secret", keycloakConfig.getClientSecret());
        }
        formData.add("username", request.getLoginId());
        formData.add("password", request.getPassword());
        formData.add("scope", "openid profile email");

        try {
            return restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .onStatus(status -> status.value() == 400 || status.value() == 401, (req, res) -> {
                        log.warn("Keycloak rejected credentials for user: {}", request.getLoginId());
                        throw new BadCredentialsException("Invalid login ID or password");
                    })
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        log.error("Keycloak token exchange failed with status: {}", res.getStatusCode());
                        throw new KeycloakIntegrationException("Failed to authenticate with Keycloak IAM", res.getStatusCode().value());
                    })
                    .body(TokenResponse.class);
        } catch (BadCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during Keycloak login communication: {}", e.getMessage(), e);
            throw new KeycloakIntegrationException("Error connecting to Keycloak service: " + e.getMessage(), e);
        }
    }

    /**
     * Refreshes an expired access token using a valid Keycloak refresh token
     */
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String tokenUrl = getTokenEndpointUrl();
        log.info("Refreshing token via Keycloak token endpoint");

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "refresh_token");
        formData.add("client_id", keycloakConfig.getClientId());
        if (keycloakConfig.getClientSecret() != null && !keycloakConfig.getClientSecret().isBlank()) {
            formData.add("client_secret", keycloakConfig.getClientSecret());
        }
        formData.add("refresh_token", request.getRefreshToken());

        try {
            return restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        log.warn("Keycloak refresh token failed with status: {}", res.getStatusCode());
                        throw new KeycloakIntegrationException("Invalid or expired refresh token", res.getStatusCode().value());
                    })
                    .body(TokenResponse.class);
        } catch (Exception e) {
            log.error("Error refreshing token in Keycloak: {}", e.getMessage(), e);
            throw new KeycloakIntegrationException("Refresh token failed: " + e.getMessage(), e);
        }
    }

    /**
     * Revokes the user session in Keycloak via the OpenID Connect logout endpoint
     * POST {auth-server-url}/realms/{realm}/protocol/openid-connect/logout
     */
    public void logout(LogoutRequest request) {
        String logoutUrl = keycloakConfig.getServerUrl() + "/realms/" + keycloakConfig.getRealm() + "/protocol/openid-connect/logout";
        log.info("Revoking Keycloak session at {}", logoutUrl);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", keycloakConfig.getClientId());
        if (keycloakConfig.getClientSecret() != null && !keycloakConfig.getClientSecret().isBlank()) {
            formData.add("client_secret", keycloakConfig.getClientSecret());
        }
        formData.add("refresh_token", request.getRefreshToken());

        try {
            restClient.post()
                    .uri(logoutUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Session successfully revoked on Keycloak IAM.");
        } catch (Exception e) {
            log.error("Error during Keycloak logout: {}", e.getMessage(), e);
            throw new KeycloakIntegrationException("Failed to revoke session in Keycloak: " + e.getMessage(), e);
        }
    }

    private String getTokenEndpointUrl() {
        return keycloakConfig.getServerUrl() + "/realms/" + keycloakConfig.getRealm() + "/protocol/openid-connect/token";
    }
}
