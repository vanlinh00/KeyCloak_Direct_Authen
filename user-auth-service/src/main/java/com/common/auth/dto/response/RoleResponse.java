package com.common.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Role response containing mapped fine-grained permissions")
public class RoleResponse {

    @Schema(description = "Role ID", example = "1")
    private Long id;

    @Schema(description = "Role name matching Keycloak role", example = "MANAGER")
    private String name;

    @Schema(description = "Role description", example = "Operations manager")
    private String description;

    @Schema(description = "Set of fine-grained permission codes assigned to this role", example = "[\"invoice:read\", \"invoice:export-pdf\"]")
    @Builder.Default
    private Set<String> permissions = new HashSet<>();

    @Schema(description = "Creation timestamp", example = "2026-09-11T05:00:00Z")
    private Instant createdAt;
}
