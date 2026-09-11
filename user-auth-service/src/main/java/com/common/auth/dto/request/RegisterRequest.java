package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dual-store user registration payload (Keycloak IAM + PostgreSQL Profile)")
public class RegisterRequest {

    // ==========================================
    // 1. Keycloak Identity Fields
    // ==========================================

    @NotBlank(message = "Login ID (username) is required")
    @Size(min = 3, max = 50, message = "Login ID must be between 3 and 50 characters")
    @Schema(description = "Keycloak username", example = "doctor_smith")
    private String loginId;

    @NotBlank(message = "Initial password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Schema(description = "Initial password set with temporary=true requiring reset upon initial login", example = "InitialTemp123!")
    private String initialPassword;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "User primary email address", example = "doctor.smith@healthcare.org")
    private String email;

    @Schema(description = "Full name, split into firstName and lastName for Keycloak", example = "Alexander Smith")
    private String fullName;

    @Schema(description = "Mapped to Keycloak emailVerified", example = "false")
    @Builder.Default
    private Boolean isConfirmed = false;

    @Schema(description = "Mapped inversely to Keycloak enabled (is_deleted=true -> enabled=false)", example = "false")
    @Builder.Default
    private Boolean isDeleted = false;

    @Schema(description = "Custom attribute stored in Keycloak user.attributes", example = "2026-01-01")
    private String accessStartDate;

    @Schema(description = "Custom attribute stored in Keycloak user.attributes", example = "2026-12-31")
    private String accessEndDate;

    // ==========================================
    // 2. PostgreSQL mydb.user_profiles Fields
    // ==========================================

    @Schema(description = "Biological gender", example = "MALE")
    private String gender;

    @Schema(description = "Date of birth", example = "1988-06-15")
    private LocalDate dateOfBirth;

    @Schema(description = "Height in centimeters", example = "178.50")
    private BigDecimal heightCm;

    @Schema(description = "Health insurance card identification number", example = "INS-987654321")
    private String insuredCardNumber;

    @Schema(description = "Health insurance card expiration date", example = "2028-12-31")
    private LocalDate insuredCardExpiration;

    @Schema(description = "Application user group or organization ID", example = "CLINICAL_GRP_01")
    private String groupId;

    @Schema(description = "Loyalty / reward points", example = "100")
    @Builder.Default
    private Long point = 0L;

    @Schema(description = "Timestamp when points were credited")
    private Instant pointReceivedDate;

    @Schema(description = "Registration verification status", example = "PENDING")
    @Builder.Default
    private String regVerifyStatus = "PENDING";

    @Schema(description = "Previous state flag for lifecycle tracking", example = "INITIAL_ONBOARDING")
    private String previousState;

    @Schema(description = "User public display nick name", example = "Alex")
    private String nickName;
}
