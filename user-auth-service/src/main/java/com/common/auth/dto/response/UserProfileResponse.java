package com.common.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Aggregated User Profile combining Keycloak IAM identity and PostgreSQL profile")
public class UserProfileResponse {

    // ==========================================
    // 1. Identity Data (Keycloak IAM / JWT)
    // ==========================================

    @Schema(description = "User unique identifier (UUID) matching Keycloak sub claim", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Username / Login ID", example = "doctor_smith")
    private String loginId;

    @Schema(description = "User primary email", example = "doctor.smith@healthcare.org")
    private String email;

    @Schema(description = "First name from Keycloak", example = "Alexander")
    private String firstName;

    @Schema(description = "Last name from Keycloak", example = "Smith")
    private String lastName;

    @Schema(description = "Full name", example = "Alexander Smith")
    private String fullName;

    @Schema(description = "Mapped from Keycloak emailVerified flag", example = "true")
    private Boolean isConfirmed;

    @Schema(description = "Derived from Keycloak enabled flag (is_deleted = !enabled)", example = "false")
    private Boolean isDeleted;

    @Schema(description = "Assigned Keycloak Realm & Client roles", example = "[\"ROLE_USER\", \"ROLE_CLINICIAN\"]")
    private List<String> roles;

    @Schema(description = "Access start date attribute from Keycloak", example = "2026-01-01")
    private String accessStartDate;

    @Schema(description = "Access end date attribute from Keycloak", example = "2026-12-31")
    private String accessEndDate;

    @Schema(description = "Account creation timestamp in Keycloak", example = "1715423400000")
    private Long keycloakCreatedTimestamp;

    // ==========================================
    // 2. Domain Data (PostgreSQL mydb.user_profiles)
    // ==========================================

    @Schema(description = "Biological gender", example = "MALE")
    private String gender;

    @Schema(description = "Date of birth", example = "1988-06-15")
    private LocalDate dateOfBirth;

    @Schema(description = "Height in centimeters", example = "178.50")
    private BigDecimal heightCm;

    @Schema(description = "Health insurance card number", example = "INS-987654321")
    private String insuredCardNumber;

    @Schema(description = "Health insurance card expiration date", example = "2028-12-31")
    private LocalDate insuredCardExpiration;

    @Schema(description = "Application user group or organization ID", example = "CLINICAL_GRP_01")
    private String groupId;

    @Schema(description = "Loyalty / reward points balance", example = "100")
    private Long point;

    @Schema(description = "Timestamp when points were credited")
    private Instant pointReceivedDate;

    @Schema(description = "Verification status", example = "PENDING")
    private String regVerifyStatus;

    @Schema(description = "Previous state flag for lifecycle tracking", example = "INITIAL_ONBOARDING")
    private String previousState;

    @Schema(description = "Public display nick name", example = "Alex")
    private String nickName;

    @Schema(description = "Profile creation timestamp in PostgreSQL")
    private Instant profileCreatedAt;

    @Schema(description = "Profile last updated timestamp in PostgreSQL")
    private Instant profileUpdatedAt;
}
