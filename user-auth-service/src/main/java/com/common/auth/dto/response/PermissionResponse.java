package com.common.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Fine-grained permission detail response")
public class PermissionResponse {

    @Schema(description = "Unique permission ID", example = "1")
    private Long id;

    @Schema(description = "Permission code (module:action)", example = "invoice:export-pdf")
    private String code;

    @Schema(description = "Module or domain namespace", example = "invoice")
    private String module;

    @Schema(description = "Permission description", example = "Export invoice documents as PDF")
    private String description;

    @Schema(description = "Creation timestamp", example = "2026-09-11T05:00:00Z")
    private Instant createdAt;
}
