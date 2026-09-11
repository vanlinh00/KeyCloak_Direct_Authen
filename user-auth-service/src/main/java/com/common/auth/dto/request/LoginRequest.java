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
@Schema(description = "Credentials payload for Keycloak Direct Access Grant authentication")
public class LoginRequest {

    @NotBlank(message = "Username or login ID is required")
    @Schema(description = "Keycloak username / login ID", example = "john_doe")
    private String loginId;

    @NotBlank(message = "Password is required")
    @Schema(description = "User account password", example = "P@ssw0rd123!")
    private String password;
}
