package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload for updating PostgreSQL domain user profile")
public class UpdateProfileRequest {

    @Schema(description = "Biological gender", example = "MALE")
    private String gender;

    @Schema(description = "Date of birth", example = "1988-06-15")
    private LocalDate dateOfBirth;

    @Schema(description = "Height in centimeters", example = "179.00")
    private BigDecimal heightCm;

    @Schema(description = "Health insurance card identification number", example = "INS-987654321")
    private String insuredCardNumber;

    @Schema(description = "Health insurance card expiration date", example = "2029-12-31")
    private LocalDate insuredCardExpiration;

    @Schema(description = "Application user group or organization ID", example = "CLINICAL_GRP_02")
    private String groupId;

    @Schema(description = "User display nick name", example = "AlexS")
    private String nickName;
}
