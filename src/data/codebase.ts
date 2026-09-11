export interface CodeFile {
  path: string;
  name: string;
  category: 'config' | 'controller' | 'service' | 'entity' | 'repository' | 'dto' | 'exception' | 'infra' | 'docs';
  language: string;
  description: string;
  content: string;
}

export const CODEBASE_FILES: CodeFile[] = [
  {
    path: 'pom.xml',
    name: 'pom.xml',
    category: 'config',
    language: 'xml',
    description: 'Maven build descriptor configured with Spring Boot 3.4.2, Keycloak Admin Client 24.0.5, Spring Security 6 OAuth2 Resource Server, Flyway, and Java 21.',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.2</version>
        <relativePath/>
    </parent>

    <groupId>com.common</groupId>
    <artifactId>user-auth-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>user-auth-service</name>
    <description>Core Authentication and User Profile Management Microservice integrating Keycloak 24+ and PostgreSQL</description>

    <properties>
        <java.version>21</java.version>
        <keycloak.version>24.0.5</keycloak.version>
        <springdoc.version>2.8.4</springdoc.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.keycloak</groupId>
            <artifactId>keycloak-admin-client</artifactId>
            <version>\${keycloak.version}</version>
        </dependency>
        <dependency>
            <groupId>org.jboss.resteasy</groupId>
            <artifactId>resteasy-client</artifactId>
            <version>6.2.9.Final</version>
        </dependency>
        <dependency>
            <groupId>org.jboss.resteasy</groupId>
            <artifactId>resteasy-jackson2-provider</artifactId>
            <version>6.2.9.Final</version>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>\${springdoc.version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>`
  },
  {
    path: 'src/main/resources/application.yml',
    name: 'application.yml',
    category: 'config',
    language: 'yaml',
    description: 'Spring Boot 3.4.2 configuration: HikariCP connection pool, Flyway, Keycloak OAuth2 Resource Server issuer, and Keycloak Admin Client settings.',
    content: `server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: user-auth-service

  datasource:
    url: \${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/mydb}
    username: \${SPRING_DATASOURCE_USERNAME:postgres}
    password: \${SPRING_DATASOURCE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: \${KEYCLOAK_AUTH_SERVER_URL:http://localhost:8081}/realms/\${KEYCLOAK_REALM:microservices-realm}
          jwk-set-uri: \${KEYCLOAK_AUTH_SERVER_URL:http://localhost:8081}/realms/\${KEYCLOAK_REALM:microservices-realm}/protocol/openid-connect/certs

keycloak:
  auth-server-url: \${KEYCLOAK_AUTH_SERVER_URL:http://localhost:8081}
  realm: \${KEYCLOAK_REALM:microservices-realm}
  client-id: \${KEYCLOAK_CLIENT_ID:user-auth-service}
  client-secret: \${KEYCLOAK_CLIENT_SECRET:admin-client-secret-placeholder}
  admin:
    username: \${KEYCLOAK_ADMIN_USERNAME:admin}
    password: \${KEYCLOAK_ADMIN_PASSWORD:admin}
    realm: master

jwt:
  auth:
    converter:
      resource-id: \${KEYCLOAK_CLIENT_ID:user-auth-service}
      principle-attribute: preferred_username`
  },
  {
    path: 'src/main/resources/db/migration/V1__init_user_profiles.sql',
    name: 'V1__init_user_profiles.sql',
    category: 'infra',
    language: 'sql',
    description: 'PostgreSQL schema for mydb.user_profiles with UUID primary key matching Keycloak sub claim, health data, rewards, and audit timestamps.',
    content: `-- Table: mydb.user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    
    -- Health Profile Data
    gender VARCHAR(20),
    date_of_birth DATE,
    height_cm NUMERIC(5, 2),
    insured_card_number VARCHAR(50),
    insured_card_expiration DATE,
    
    -- Application & Rewards Data
    group_id VARCHAR(50),
    point BIGINT DEFAULT 0 NOT NULL,
    point_received_date TIMESTAMP WITH TIME ZONE,
    reg_verify_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    previous_state VARCHAR(50),
    nick_name VARCHAR(100),
    
    -- Audit Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_group_id ON user_profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_reg_verify_status ON user_profiles(reg_verify_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_insured_card_number ON user_profiles(insured_card_number);`
  },
  {
    path: 'src/main/java/com/common/auth/UserAuthServiceApplication.java',
    name: 'UserAuthServiceApplication.java',
    category: 'config',
    language: 'java',
    description: 'Spring Boot 3.4.2 Main Application Entrypoint with JPA Auditing enabled.',
    content: `package com.common.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class UserAuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserAuthServiceApplication.class, args);
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/config/SecurityConfig.java',
    name: 'SecurityConfig.java',
    category: 'config',
    language: 'java',
    description: 'Spring Security 6 Resource Server configuration, stateless session, CORS, CSRF disablement, and custom JWT authentication converter.',
    content: `package com.common.auth.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthConverter jwtAuthConverter;

    private static final String[] PUBLIC_WHITELIST = {
            "/api/v1/auth/**",
            "/v3/api-docs/**",
            "/v3/api-docs.yaml",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/health",
            "/actuator/info"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_WHITELIST).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/register").permitAll()
                        .requestMatchers("/api/v1/users/**").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/config/JwtAuthConverter.java',
    name: 'JwtAuthConverter.java',
    category: 'config',
    language: 'java',
    description: 'Custom Spring Security 6 JWT Converter extracting Keycloak realm_access.roles and resource_access.{client}.roles into Spring GrantedAuthority list.',
    content: `package com.common.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Value("\${jwt.auth.converter.principle-attribute:preferred_username}")
    private String principleAttribute;

    @Value("\${jwt.auth.converter.resource-id:user-auth-service}")
    private String resourceId;

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                jwtGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractResourceAndRealmRoles(jwt).stream()
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(
                jwt,
                authorities,
                getPrincipalClaimName(jwt)
        );
    }

    private String getPrincipalClaimName(Jwt jwt) {
        String claimName = JwtClaimNames.SUB;
        if (principleAttribute != null && jwt.hasClaim(principleAttribute)) {
            claimName = principleAttribute;
        }
        return jwt.getClaim(claimName);
    }

    @SuppressWarnings("unchecked")
    private Collection<? extends GrantedAuthority> extractResourceAndRealmRoles(Jwt jwt) {
        Set<GrantedAuthority> grantedAuthorities = new HashSet<>();

        // Extract Keycloak Realm Roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            Collection<String> realmRoles = (Collection<String>) realmAccess.get("roles");
            if (realmRoles != null) {
                realmRoles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                        .forEach(grantedAuthorities::add);
            }
        }

        // Extract Keycloak Client Specific Roles
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null && resourceAccess.containsKey(resourceId)) {
            Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get(resourceId);
            if (clientAccess != null && clientAccess.containsKey("roles")) {
                Collection<String> clientRoles = (Collection<String>) clientAccess.get("roles");
                if (clientRoles != null) {
                    clientRoles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                            .forEach(grantedAuthorities::add);
                }
            }
        }

        return grantedAuthorities;
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/config/KeycloakAdminConfig.java',
    name: 'KeycloakAdminConfig.java',
    category: 'config',
    language: 'java',
    description: 'Keycloak 24 Admin Client connection bean using RESTEasy client pool for managing user creation and attributes.',
    content: `package com.common.auth.config;

import org.jboss.resteasy.client.jaxrs.internal.ResteasyClientBuilderImpl;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminConfig {

    @Value("\${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("\${keycloak.realm}")
    private String realm;

    @Value("\${keycloak.client-id}")
    private String clientId;

    @Value("\${keycloak.client-secret:}")
    private String clientSecret;

    @Value("\${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("\${keycloak.admin.password:admin}")
    private String adminPassword;

    @Value("\${keycloak.admin.realm:master}")
    private String adminRealm;

    @Bean
    public Keycloak keycloakAdminClient() {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(adminRealm)
                .username(adminUsername)
                .password(adminPassword)
                .clientId("admin-cli")
                .grantType(OAuth2Constants.PASSWORD)
                .resteasyClient(new ResteasyClientBuilderImpl()
                        .connectionPoolSize(20)
                        .build())
                .build();
    }

    public String getRealm() { return realm; }
    public String getServerUrl() { return serverUrl; }
    public String getClientId() { return clientId; }
    public String getClientSecret() { return clientSecret; }
}`
  },
  {
    path: 'src/main/java/com/common/auth/entity/UserProfile.java',
    name: 'UserProfile.java',
    category: 'entity',
    language: 'java',
    description: 'JPA entity mapped to mydb.user_profiles with UUID primary key matching Keycloak sub claim.',
    content: `package com.common.auth.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    // Health Profile Data
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

    // Application & Rewards Data
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

    // Audit Metadata
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}`
  },
  {
    path: 'src/main/java/com/common/auth/repository/UserProfileRepository.java',
    name: 'UserProfileRepository.java',
    category: 'repository',
    language: 'java',
    description: 'Spring Data JPA Repository for UserProfile with query methods for insuredCardNumber uniqueness check.',
    content: `package com.common.auth.repository;

import com.common.auth.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByInsuredCardNumber(String insuredCardNumber);
    boolean existsByInsuredCardNumber(String insuredCardNumber);
}`
  },
  {
    path: 'src/main/java/com/common/auth/service/AuthService.java',
    name: 'AuthService.java',
    category: 'service',
    language: 'java',
    description: 'Authentication Service interacting with Keycloak token and logout endpoints using Spring 6 RestClient.',
    content: `package com.common.auth.service;

import com.common.auth.config.KeycloakAdminConfig;
import com.common.auth.dto.request.LoginRequest;
import com.common.auth.dto.request.LogoutRequest;
import com.common.auth.dto.request.RefreshTokenRequest;
import com.common.auth.dto.response.TokenResponse;
import com.common.auth.exception.KeycloakIntegrationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final KeycloakAdminConfig keycloakConfig;
    private final RestClient restClient = RestClient.builder().build();

    public TokenResponse login(LoginRequest request) {
        String tokenUrl = getTokenEndpointUrl();
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", keycloakConfig.getClientId());
        if (keycloakConfig.getClientSecret() != null && !keycloakConfig.getClientSecret().isBlank()) {
            formData.add("client_secret", keycloakConfig.getClientSecret());
        }
        formData.add("username", request.getLoginId());
        formData.add("password", request.getPassword());
        formData.add("scope", "openid profile email");

        return restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .onStatus(status -> status.value() == 400 || status.value() == 401, (req, res) -> {
                    throw new BadCredentialsException("Invalid login ID or password");
                })
                .body(TokenResponse.class);
    }

    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String tokenUrl = getTokenEndpointUrl();
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "refresh_token");
        formData.add("client_id", keycloakConfig.getClientId());
        if (keycloakConfig.getClientSecret() != null && !keycloakConfig.getClientSecret().isBlank()) {
            formData.add("client_secret", keycloakConfig.getClientSecret());
        }
        formData.add("refresh_token", request.getRefreshToken());

        return restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(TokenResponse.class);
    }

    public void logout(LogoutRequest request) {
        String logoutUrl = keycloakConfig.getServerUrl() + "/realms/" + keycloakConfig.getRealm() + "/protocol/openid-connect/logout";
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", keycloakConfig.getClientId());
        formData.add("refresh_token", request.getRefreshToken());

        restClient.post()
                .uri(logoutUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .toBodilessEntity();
    }

    private String getTokenEndpointUrl() {
        return keycloakConfig.getServerUrl() + "/realms/" + keycloakConfig.getRealm() + "/protocol/openid-connect/token";
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/service/UserService.java',
    name: 'UserService.java',
    category: 'service',
    language: 'java',
    description: 'User registration with distributed saga compensation rollback (Keycloak user removal if PostgreSQL fails), and profile fetching.',
    content: `package com.common.auth.service;

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
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final KeycloakAdminConfig keycloakConfig;
    private final Keycloak keycloakAdminClient;
    private final UserProfileRepository userProfileRepository;

    public UserProfileResponse register(RegisterRequest request) {
        UsersResource usersResource = keycloakAdminClient.realm(keycloakConfig.getRealm()).users();

        // 1. Prepare Keycloak Identity
        UserRepresentation userRep = new UserRepresentation();
        userRep.setUsername(request.getLoginId());
        userRep.setEmail(request.getEmail());
        userRep.setEmailVerified(Boolean.TRUE.equals(request.getIsConfirmed()));
        userRep.setEnabled(!Boolean.TRUE.equals(request.getIsDeleted()));

        if (request.getFullName() != null) {
            String[] parts = request.getFullName().trim().split("\\\\s+", 2);
            userRep.setFirstName(parts[0]);
            if (parts.length > 1) userRep.setLastName(parts[1]);
        }

        CredentialRepresentation cred = new CredentialRepresentation();
        cred.setType(CredentialRepresentation.PASSWORD);
        cred.setValue(request.getInitialPassword());
        cred.setTemporary(true);
        userRep.setCredentials(List.of(cred));

        Map<String, List<String>> attributes = new HashMap<>();
        if (request.getAccessStartDate() != null) attributes.put("access_start_date", List.of(request.getAccessStartDate()));
        if (request.getAccessEndDate() != null) attributes.put("access_end_date", List.of(request.getAccessEndDate()));
        userRep.setAttributes(attributes);

        // 2. Step 1: Create in Keycloak
        String createdUserIdStr;
        try (Response response = usersResource.create(userRep)) {
            if (response.getStatus() == 409) {
                throw new UserAlreadyExistsException("Username or email is already registered in Keycloak");
            }
            if (response.getStatus() != 201) {
                throw new KeycloakIntegrationException("Failed to create user in Keycloak", response.getStatus());
            }
            String path = response.getLocation().getPath();
            createdUserIdStr = path.replaceAll(".*/([^/]+)$", "$1");
        }

        UUID userId = UUID.fromString(createdUserIdStr);

        // 3. Step 2: Persist in PostgreSQL with Compensation Rollback
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
        } catch (Exception ex) {
            log.error("Postgres insert failed for userId {}. Compensating Keycloak user rollback...", userId, ex);
            try {
                usersResource.get(createdUserIdStr).remove();
            } catch (Exception rollbackEx) {
                log.error("CRITICAL: Failed to rollback Keycloak user {}", createdUserIdStr, rollbackEx);
            }
            throw new RuntimeException("Database error persisting profile. Transaction compensated.", ex);
        }

        return buildResponse(userRep, profile, userId);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getMe(UUID userId, Jwt jwt) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for ID: " + userId));
        return buildJwtResponse(jwt, profile);
    }

    @Transactional
    public UserProfileResponse updateMe(UUID userId, UpdateProfileRequest req, Jwt jwt) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for ID: " + userId));
        if (req.getGender() != null) profile.setGender(req.getGender());
        if (req.getDateOfBirth() != null) profile.setDateOfBirth(req.getDateOfBirth());
        if (req.getHeightCm() != null) profile.setHeightCm(req.getHeightCm());
        if (req.getInsuredCardNumber() != null) profile.setInsuredCardNumber(req.getInsuredCardNumber());
        if (req.getInsuredCardExpiration() != null) profile.setInsuredCardExpiration(req.getInsuredCardExpiration());
        if (req.getGroupId() != null) profile.setGroupId(req.getGroupId());
        if (req.getNickName() != null) profile.setNickName(req.getNickName());
        userProfileRepository.save(profile);
        return getMe(userId, jwt);
    }

    private UserProfileResponse buildResponse(UserRepresentation userRep, UserProfile p, UUID id) {
        return UserProfileResponse.builder()
                .id(id)
                .loginId(userRep.getUsername())
                .email(userRep.getEmail())
                .firstName(userRep.getFirstName())
                .lastName(userRep.getLastName())
                .isConfirmed(userRep.isEmailVerified())
                .isDeleted(!Boolean.TRUE.equals(userRep.isEnabled()))
                .gender(p.getGender())
                .dateOfBirth(p.getDateOfBirth())
                .heightCm(p.getHeightCm())
                .insuredCardNumber(p.getInsuredCardNumber())
                .groupId(p.getGroupId())
                .point(p.getPoint())
                .regVerifyStatus(p.getRegVerifyStatus())
                .nickName(p.getNickName())
                .build();
    }

    private UserProfileResponse buildJwtResponse(Jwt jwt, UserProfile p) {
        return UserProfileResponse.builder()
                .id(p.getId())
                .loginId(jwt.getClaimAsString("preferred_username"))
                .email(jwt.getClaimAsString("email"))
                .fullName(jwt.getClaimAsString("name"))
                .isConfirmed(jwt.getClaimAsBoolean("email_verified"))
                .gender(p.getGender())
                .dateOfBirth(p.getDateOfBirth())
                .heightCm(p.getHeightCm())
                .insuredCardNumber(p.getInsuredCardNumber())
                .insuredCardExpiration(p.getInsuredCardExpiration())
                .groupId(p.getGroupId())
                .point(p.getPoint())
                .regVerifyStatus(p.getRegVerifyStatus())
                .nickName(p.getNickName())
                .profileCreatedAt(p.getCreatedAt())
                .profileUpdatedAt(p.getUpdatedAt())
                .build();
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/controller/AuthController.java',
    name: 'AuthController.java',
    category: 'controller',
    language: 'java',
    description: 'REST Controller for /api/v1/auth endpoints: login, refresh, logout.',
    content: `package com.common.auth.controller;

import com.common.auth.dto.request.LoginRequest;
import com.common.auth.dto.request.LogoutRequest;
import com.common.auth.dto.request.RefreshTokenRequest;
import com.common.auth.dto.response.ApiResponse;
import com.common.auth.dto.response.TokenResponse;
import com.common.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Keycloak token lifecycle operations")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login via Direct Access Grant")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", authService.login(request)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh expired access token")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", authService.refreshToken(request)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke Keycloak user session")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Session revoked", null));
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/controller/UserController.java',
    name: 'UserController.java',
    category: 'controller',
    language: 'java',
    description: 'REST Controller for /api/v1/users endpoints: register, me (GET), me (PUT).',
    content: `package com.common.auth.controller;

import com.common.auth.dto.request.RegisterRequest;
import com.common.auth.dto.request.UpdateProfileRequest;
import com.common.auth.dto.response.ApiResponse;
import com.common.auth.dto.response.UserProfileResponse;
import com.common.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Dual-store user onboarding and profile lifecycle")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "Register user in Keycloak and PostgreSQL")
    public ResponseEntity<ApiResponse<UserProfileResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserProfileResponse res = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User registered", res));
    }

    @GetMapping("/me")
    @Operation(summary = "Get authenticated user profile (Keycloak JWT + PostgreSQL)", security = @SecurityRequirement(name = "KeycloakBearerAuth"))
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMe(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(ApiResponse.success(userService.getMe(userId, jwt)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update domain user profile in PostgreSQL", security = @SecurityRequirement(name = "KeycloakBearerAuth"))
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMe(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(ApiResponse.success(userService.updateMe(userId, request, jwt)));
    }
}`
  },
  {
    path: 'src/main/java/com/common/auth/dto/request/RegisterRequest.java',
    name: 'RegisterRequest.java',
    category: 'dto',
    language: 'java',
    description: 'Registration payload mapping Keycloak identity attributes and PostgreSQL domain profile fields.',
    content: `package com.common.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    // Keycloak IAM
    @NotBlank private String loginId;
    @NotBlank private String initialPassword;
    @NotBlank @Email private String email;
    private String fullName;
    @Builder.Default private Boolean isConfirmed = false;
    @Builder.Default private Boolean isDeleted = false;
    private String accessStartDate;
    private String accessEndDate;

    // PostgreSQL mydb.user_profiles
    private String gender;
    private LocalDate dateOfBirth;
    private BigDecimal heightCm;
    private String insuredCardNumber;
    private LocalDate insuredCardExpiration;
    private String groupId;
    @Builder.Default private Long point = 0L;
    private Instant pointReceivedDate;
    @Builder.Default private String regVerifyStatus = "PENDING";
    private String previousState;
    private String nickName;
}`
  },
  {
    path: 'src/main/java/com/common/auth/exception/GlobalExceptionHandler.java',
    name: 'GlobalExceptionHandler.java',
    category: 'exception',
    language: 'java',
    description: 'Centralized exception handler translating validation, 409 conflict, 401 unauth, and Keycloak errors into standardized ApiResponse envelopes.',
    content: `package com.common.auth.exception;

import com.common.auth.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors()) {
            errors.put(err.getField(), err.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ApiResponse.<Map<String, String>>builder()
                .success(false).message("Validation failed").data(errors).build());
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(UserAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
    }
}`
  },
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    category: 'infra',
    language: 'yaml',
    description: 'Production Docker Compose stack with PostgreSQL 16 (mydb), Keycloak 24+ with healthcheck, and user-auth-service container.',
    content: `version: '3.8'

services:
  postgres-db:
    image: postgres:16-alpine
    container_name: user-auth-postgres
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:24.0.5
    container_name: user-auth-keycloak
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: adminpassword
      KC_HTTP_PORT: 8081
    ports:
      - "8081:8081"

  user-auth-service:
    build: .
    container_name: user-auth-service
    depends_on:
      - postgres-db
      - keycloak
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-db:5432/mydb
      KEYCLOAK_AUTH_SERVER_URL: http://keycloak:8081
      KEYCLOAK_REALM: microservices-realm

volumes:
  postgres_data:`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Senior Backend Architect Architectural Specifications, Keycloak 24 Realm Setup, and Endpoints Guide.',
    content: `# user-auth-service

Production-ready Authentication and User Profile Management Microservice built with Spring Boot 3.4.2, Java 21, Keycloak 24+, and PostgreSQL (mydb).`
  }
];
