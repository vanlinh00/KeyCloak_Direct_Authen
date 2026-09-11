package com.common.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    /**
     * Primary Key matching Keycloak User UUID ('sub' claim).
     * Not auto-generated because it is deterministically provided by Keycloak upon identity registration.
     */
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    // --- Health Profile Data ---

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "insured_card_number", length = 50)
    private String insuredCardNumber;

    @Column(name = "insured_card_expiration")
    private LocalDate insuredCardExpiration;

    // --- Application & Rewards Data ---

    @Column(name = "group_id", length = 50)
    private String groupId;

    @Column(name = "point", nullable = false)
    @Builder.Default
    private Long point = 0L;

    @Column(name = "point_received_date")
    private Instant pointReceivedDate;

    @Column(name = "reg_verify_status", length = 50, nullable = false)
    @Builder.Default
    private String regVerifyStatus = "PENDING";

    @Column(name = "previous_state", length = 50)
    private String previousState;

    @Column(name = "nick_name", length = 100)
    private String nickName;

    // --- Audit Metadata ---

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
