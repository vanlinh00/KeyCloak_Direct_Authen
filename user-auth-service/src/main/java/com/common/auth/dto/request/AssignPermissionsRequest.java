package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload for assigning or removing fine-grained permissions to/from a role")
public class AssignPermissionsRequest {

    @NotEmpty(message = "At least one permission code must be provided")
    @Schema(description = "Set of fine-grained permission codes to assign or remove", example = "[\"invoice:export-pdf\", \"user:delete\"]")
    private Set<String> permissionCodes;
}
