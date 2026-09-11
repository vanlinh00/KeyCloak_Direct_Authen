package com.common.auth.service;

import com.common.auth.config.KeycloakAdminConfig;
import com.common.auth.dto.request.RegisterRequest;
import com.common.auth.dto.request.UpdateProfileRequest;
import com.common.auth.dto.response.UserProfileResponse;
import com.common.auth.entity.UserProfile;
import com.common.auth.exception.KeycloakIntegrationException;
import com.common.auth.exception.ResourceNotFoundException;
import com.common.auth.exception.UserAlreadyExistsException;
import com.common.auth.repository.UserProfileRepository;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final KeycloakAdminConfig keycloakConfig;
    private final Keycloak keycloakAdminClient;
    private final UserProfileRepository userProfileRepository;

    /**
     * Registers a new user across both Keycloak (IAM credentials & access attributes)
     * and PostgreSQL (extended business/health profile data).
     * Implements a 2-step distributed saga with automatic compensation rollback.
     */
    public UserProfileResponse register(RegisterRequest request) {
        log.info("Starting dual-store registration for loginId: {}", request.getLoginId());
        RealmResource realmResource = keycloakAdminClient.realm(keycloakConfig.getRealm());
        UsersResource usersResource = realmResource.users();

        // 1. Pre-validation: verify insured card uniqueness if provided
        if (request.getInsuredCardNumber() != null && !request.getInsuredCardNumber().isBlank()) {
            if (userProfileRepository.existsByInsuredCardNumber(request.getInsuredCardNumber())) {
                throw new UserAlreadyExistsException("Insured card number is already registered in the system");
            }
        }

        // 2. Build Keycloak User Representation
        UserRepresentation userRep = new UserRepresentation();
        userRep.setUsername(request.getLoginId());
        userRep.setEmail(request.getEmail());
        userRep.setEmailVerified(Boolean.TRUE.equals(request.getIsConfirmed()));
        userRep.setEnabled(!Boolean.TRUE.equals(request.getIsDeleted()));

        // Split full name if provided
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            String[] parts = request.getFullName().trim().split("\\s+", 2);
            userRep.setFirstName(parts[0]);
            if (parts.length > 1) {
                userRep.setLastName(parts[1]);
            }
        }

        // Map initial password with temporary = true
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getInitialPassword());
        credential.setTemporary(true); // Forces password update upon initial login
        userRep.setCredentials(Collections.singletonList(credential));

        // Map custom Keycloak user attributes
        Map<String, List<String>> attributes = new HashMap<>();
        if (request.getAccessStartDate() != null) {
            attributes.put("access_start_date", List.of(request.getAccessStartDate()));
        }
        if (request.getAccessEndDate() != null) {
            attributes.put("access_end_date", List.of(request.getAccessEndDate()));
        }
        userRep.setAttributes(attributes);

        // 3. Step 1 of Saga: Create Identity Record in Keycloak
        String createdUserIdStr;
        try (Response response = usersResource.create(userRep)) {
            if (response.getStatus() == 409) {
                log.warn("Keycloak user creation conflict: User already exists for username/email {}", request.getLoginId());
                throw new UserAlreadyExistsException("Username or email is already registered in Keycloak");
            }

            if (response.getStatus() != 201) {
                log.error("Failed to create Keycloak user. Status: {}", response.getStatus());
                throw new KeycloakIntegrationException("Failed to create user in Keycloak IAM", response.getStatus());
            }

            // Extract UUID from Location header path
            String path = response.getLocation().getPath();
            createdUserIdStr = path.replaceAll(".*/([^/]+)$", "$1");
            log.info("Successfully created Keycloak user identity with ID: {}", createdUserIdStr);
        } catch (UserAlreadyExistsException | KeycloakIntegrationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Keycloak user creation: {}", e.getMessage(), e);
            throw new KeycloakIntegrationException("Error communicating with Keycloak Admin: " + e.getMessage(), e);
        }

        UUID userId = UUID.fromString(createdUserIdStr);

        // 4. Step 2 of Saga: Persist Domain Profile in PostgreSQL mydb.user_profiles
        UserProfile profile;
        try {
            profile = UserProfile.builder()
                    .id(userId)
                    .gender(request.getGender())
                    .dateOfBirth(request.getDateOfBirth())
                    .heightCm(request.getHeightCm())
                    .insuredCardNumber(request.getInsuredCardNumber())
                    .insuredCardExpiration(request.getInsuredCardExpiration())
                    .groupId(request.getGroupId())
                    .point(request.getPoint() != null ? request.getPoint() : 0L)
                    .pointReceivedDate(request.getPointReceivedDate() != null ? request.getPointReceivedDate() : Instant.now())
                    .regVerifyStatus(request.getRegVerifyStatus() != null ? request.getRegVerifyStatus() : "PENDING")
                    .previousState(request.getPreviousState() != null ? request.getPreviousState() : "REGISTERED")
                    .nickName(request.getNickName())
                    .build();

            profile = userProfileRepository.save(profile);
            log.info("Successfully persisted domain profile in PostgreSQL mydb.user_profiles for userId: {}", userId);
        } catch (Exception dbException) {
            // CRITICAL SAGA COMPENSATION: Roll back Keycloak identity to maintain data consistency
            log.error("Failed to persist user profile in PostgreSQL. Initiating Keycloak compensation rollback for userId: {}", userId, dbException);
            try {
                usersResource.get(createdUserIdStr).remove();
                log.info("Keycloak compensation rollback successful: Deleted orphaned user {}", createdUserIdStr);
            } catch (Exception rollbackException) {
                log.error("CRITICAL ALARM: Failed to compensate Keycloak rollback for user {}. Manual intervention required!", createdUserIdStr, rollbackException);
            }
            throw new RuntimeException("Database error occurred while persisting user profile. Transaction rolled back.", dbException);
        }

        return buildUserProfileResponse(userRep, profile, userId);
    }

    /**
     * Retrieves current user profile combining Keycloak JWT claims and PostgreSQL profile data.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getMe(UUID userId, Jwt jwt) {
        log.info("Fetching profile for authenticated user: {}", userId);

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found in database for ID: " + userId));

        // Fetch live Keycloak representation for extended attributes
        UserRepresentation keycloakUser = null;
        try {
            keycloakUser = keycloakAdminClient.realm(keycloakConfig.getRealm())
                    .users()
                    .get(userId.toString())
                    .toRepresentation();
        } catch (Exception e) {
            log.warn("Could not query Keycloak Admin API for user attributes, falling back to JWT claims: {}", e.getMessage());
        }

        return buildResponseFromJwtAndProfile(jwt, keycloakUser, profile);
    }

    /**
     * Updates extended domain profile fields in PostgreSQL mydb.user_profiles.
     */
    @Transactional
    public UserProfileResponse updateMe(UUID userId, UpdateProfileRequest request, Jwt jwt) {
        log.info("Updating profile for user: {}", userId);

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for ID: " + userId));

        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getHeightCm() != null) profile.setHeightCm(request.getHeightCm());
        if (request.getInsuredCardNumber() != null) profile.setInsuredCardNumber(request.getInsuredCardNumber());
        if (request.getInsuredCardExpiration() != null) profile.setInsuredCardExpiration(request.getInsuredCardExpiration());
        if (request.getGroupId() != null) profile.setGroupId(request.getGroupId());
        if (request.getNickName() != null) profile.setNickName(request.getNickName());

        UserProfile updated = userProfileRepository.save(profile);
        return getMe(userId, jwt);
    }

    private UserProfileResponse buildUserProfileResponse(UserRepresentation userRep, UserProfile profile, UUID userId) {
        String accessStartDate = null;
        String accessEndDate = null;
        if (userRep.getAttributes() != null) {
            List<String> startDates = userRep.getAttributes().get("access_start_date");
            if (startDates != null && !startDates.isEmpty()) accessStartDate = startDates.get(0);
            List<String> endDates = userRep.getAttributes().get("access_end_date");
            if (endDates != null && !endDates.isEmpty()) accessEndDate = endDates.get(0);
        }

        return UserProfileResponse.builder()
                .id(userId)
                .loginId(userRep.getUsername())
                .email(userRep.getEmail())
                .firstName(userRep.getFirstName())
                .lastName(userRep.getLastName())
                .fullName((userRep.getFirstName() != null ? userRep.getFirstName() + " " : "") + (userRep.getLastName() != null ? userRep.getLastName() : ""))
                .isConfirmed(userRep.isEmailVerified())
                .isDeleted(!Boolean.TRUE.equals(userRep.isEnabled()))
                .accessStartDate(accessStartDate)
                .accessEndDate(accessEndDate)
                .gender(profile.getGender())
                .dateOfBirth(profile.getDateOfBirth())
                .heightCm(profile.getHeightCm())
                .insuredCardNumber(profile.getInsuredCardNumber())
                .insuredCardExpiration(profile.getInsuredCardExpiration())
                .groupId(profile.getGroupId())
                .point(profile.getPoint())
                .pointReceivedDate(profile.getPointReceivedDate())
                .regVerifyStatus(profile.getRegVerifyStatus())
                .previousState(profile.getPreviousState())
                .nickName(profile.getNickName())
                .profileCreatedAt(profile.getCreatedAt())
                .profileUpdatedAt(profile.getUpdatedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private UserProfileResponse buildResponseFromJwtAndProfile(Jwt jwt, UserRepresentation keycloakUser, UserProfile profile) {
        String loginId = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        String fullName = jwt.getClaimAsString("name");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");
        Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");

        List<String> roles = new ArrayList<>();
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            roles.addAll((List<String>) realmAccess.get("roles"));
        }

        String accessStartDate = null;
        String accessEndDate = null;
        Long createdTimestamp = null;
        Boolean isDeleted = false;

        if (keycloakUser != null) {
            isDeleted = !Boolean.TRUE.equals(keycloakUser.isEnabled());
            createdTimestamp = keycloakUser.getCreatedTimestamp();
            if (keycloakUser.getAttributes() != null) {
                List<String> startDates = keycloakUser.getAttributes().get("access_start_date");
                if (startDates != null && !startDates.isEmpty()) accessStartDate = startDates.get(0);
                List<String> endDates = keycloakUser.getAttributes().get("access_end_date");
                if (endDates != null && !endDates.isEmpty()) accessEndDate = endDates.get(0);
            }
        }

        return UserProfileResponse.builder()
                .id(profile.getId())
                .loginId(loginId != null ? loginId : (keycloakUser != null ? keycloakUser.getUsername() : null))
                .email(email != null ? email : (keycloakUser != null ? keycloakUser.getEmail() : null))
                .firstName(firstName != null ? firstName : (keycloakUser != null ? keycloakUser.getFirstName() : null))
                .lastName(lastName != null ? lastName : (keycloakUser != null ? keycloakUser.getLastName() : null))
                .fullName(fullName != null ? fullName : (firstName != null && lastName != null ? firstName + " " + lastName : null))
                .isConfirmed(emailVerified != null ? emailVerified : (keycloakUser != null && keycloakUser.isEmailVerified()))
                .isDeleted(isDeleted)
                .roles(roles)
                .accessStartDate(accessStartDate)
                .accessEndDate(accessEndDate)
                .keycloakCreatedTimestamp(createdTimestamp)
                .gender(profile.getGender())
                .dateOfBirth(profile.getDateOfBirth())
                .heightCm(profile.getHeightCm())
                .insuredCardNumber(profile.getInsuredCardNumber())
                .insuredCardExpiration(profile.getInsuredCardExpiration())
                .groupId(profile.getGroupId())
                .point(profile.getPoint())
                .pointReceivedDate(profile.getPointReceivedDate())
                .regVerifyStatus(profile.getRegVerifyStatus())
                .previousState(profile.getPreviousState())
                .nickName(profile.getNickName())
                .profileCreatedAt(profile.getCreatedAt())
                .profileUpdatedAt(profile.getUpdatedAt())
                .build();
    }
}
