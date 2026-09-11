package com.common.auth.repository;

import com.common.auth.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByInsuredCardNumber(String insuredCardNumber);

    boolean existsByInsuredCardNumber(String insuredCardNumber);
}
