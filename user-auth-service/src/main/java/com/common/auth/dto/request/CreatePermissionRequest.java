package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload for creating a new fine-grained action permission")
public class CreatePermissionRequest {

    @NotBlank(message = "Permission code is required")
    @Size(min = 3, max = 100, message = "Permission code must be between 3 and 100 characters")
    @Pattern(regexp = "^[a-z0-9_-]+:[a-z0-9_*-]+$", message = "Permission code must follow 'module:action' format (e.g. 'invoice:export-pdf')")
    @Schema(description = "Unique permission action code", example = "invoice:export-pdf")
    private String code;

    @NotBlank(message = "Module is required")
    @Size(min = 2, max = 50, message = "Module name must be between 2 and 50 characters")
    @Schema(description = "Domain module namespace", example = "invoice")
    private String module;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    @Schema(description = "Human-readable description of the action permission", example = "Export invoices as PDF documents")
    private String description;
}
