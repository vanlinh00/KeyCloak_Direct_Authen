package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload for changing the authenticated user's password")
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    @Schema(description = "Current active password for verification", example = "OldP@ssw0rd123!")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "New password must be at least 8 characters long")
    @Schema(description = "New password to set", example = "NewSecureP@ss2026!")
    private String newPassword;

    @NotBlank(message = "Confirmation password is required")
    @Schema(description = "Must match the new password exactly", example = "NewSecureP@ss2026!")
    private String confirmationPassword;
}
