package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload for creating a new role with optional initial permissions")
public class CreateRoleRequest {

    @NotBlank(message = "Role name is required")
    @Size(min = 2, max = 50, message = "Role name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Role name must contain uppercase letters, numbers, and underscores (e.g. 'MANAGER')")
    @Schema(description = "Role name matching Keycloak realm or client role", example = "FINANCE_OFFICER")
    private String name;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    @Schema(description = "Role description", example = "Finance department officer with invoice permissions")
    private String description;

    @Schema(description = "Initial permission codes to assign to the role", example = "[\"invoice:read\", \"invoice:export-pdf\"]")
    @Builder.Default
    private Set<String> permissionCodes = new HashSet<>();
}
