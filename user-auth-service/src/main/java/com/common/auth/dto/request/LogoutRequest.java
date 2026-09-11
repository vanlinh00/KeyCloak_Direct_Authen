package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User session revocation request")
public class LogoutRequest {

    @NotBlank(message = "Refresh token is required to revoke user session")
    @Schema(description = "Refresh token to revoke on Keycloak end-session endpoint", example = "eyJhbGciOiJSUzI1Ni...")
    private String refreshToken;
}
