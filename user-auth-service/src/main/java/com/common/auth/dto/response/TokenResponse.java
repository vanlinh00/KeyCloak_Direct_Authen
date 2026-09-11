package com.common.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "OAuth2 / OIDC Token Response issued by Keycloak")
public class TokenResponse {

    @JsonProperty("access_token")
    @Schema(description = "JWT Access Token for Bearer authentication")
    private String accessToken;

    @JsonProperty("refresh_token")
    @Schema(description = "Refresh Token for renewing access tokens")
    private String refreshToken;

    @JsonProperty("expires_in")
    @Schema(description = "Access token lifetime in seconds", example = "300")
    private Long expiresIn;

    @JsonProperty("refresh_expires_in")
    @Schema(description = "Refresh token lifetime in seconds", example = "1800")
    private Long refreshExpiresIn;

    @JsonProperty("token_type")
    @Builder.Default
    @Schema(description = "Token type", example = "Bearer")
    private String tokenType = "Bearer";

    @JsonProperty("scope")
    @Schema(description = "Authorized OAuth2 scopes", example = "openid profile email")
    private String scope;
}
