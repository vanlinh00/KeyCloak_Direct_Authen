package com.common.auth.repository;

import com.common.auth.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByCode(String code);

    boolean existsByCode(String code);

    List<Permission> findByModule(String module);

    List<Permission> findByCodeIn(Collection<String> codes);

    @Query("SELECT DISTINCT p.code FROM Permission p JOIN p.roles r WHERE r.name IN :roleNames")
    Set<String> findCodesByRoleNames(@Param("roleNames") Collection<String> roleNames);

    @Query("SELECT DISTINCT p.code FROM Permission p JOIN p.roles r WHERE r.name = :roleName")
    Set<String> findCodesByRoleName(@Param("roleName") String roleName);
}
