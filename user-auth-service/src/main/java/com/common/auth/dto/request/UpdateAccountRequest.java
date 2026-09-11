package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload for updating user full name and email / Gmail address")
public class UpdateAccountRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Schema(description = "Full name (split into first and last name in Keycloak IAM)", example = "Alexander John Smith")
    private String fullName;

    @Email(message = "Invalid email format. Please provide a valid email (e.g. user@gmail.com)")
    @Schema(description = "User primary email or Gmail address", example = "alexander.smith@gmail.com")
    private String email;
}
