package com.common.auth.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Reusable security utility component that encapsulates Spring Security Context operations.
 * Decouples controllers and web layer from framework-specific security classes (Jwt, Authentication).
 */
@Component
@Slf4j
public class SecurityUtils {

    /**
     * Safely retrieves the active Authentication object from the SecurityContextHolder.
     *
     * @return the authenticated Authentication object
     * @throws AuthenticationCredentialsNotFoundException if no valid authenticated context is present
     */
    public Authentication getAuthentication() {
        SecurityContext context = SecurityContextHolder.getContext();
        if (context == null) {
            log.warn("SecurityContext is null");
            throw new AuthenticationCredentialsNotFoundException("No security context found");
        }

        Authentication authentication = context.getAuthentication();
        if (authentication == null 
                || !authentication.isAuthenticated() 
                || authentication instanceof AnonymousAuthenticationToken) {
            log.warn("Attempt to access secured context without valid authentication");
            throw new AuthenticationCredentialsNotFoundException("User is unauthenticated or credentials missing");
        }

        return authentication;
    }

    /**
     * Optional accessor for active authentication without throwing exceptions.
     */
    public Optional<Authentication> getCurrentAuthentication() {
        try {
            return Optional.of(getAuthentication());
        } catch (AuthenticationCredentialsNotFoundException ex) {
            return Optional.empty();
        }
    }

    /**
     * Checks if the current execution context is authenticated.
     */
    public boolean isAuthenticated() {
        return getCurrentAuthentication().isPresent();
    }

    /**
     * Extracts the active user's unique identifier (subject) as a String.
     *
     * @return User ID string (JWT 'sub' claim or username)
     */
    public String getCurrentUserId() {
        Authentication authentication = getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            String subject = jwt.getSubject();
            if (subject != null && !subject.isBlank()) {
                return subject;
            }
            if (jwt.hasClaim(JwtClaimNames.SUB)) {
                return jwt.getClaimAsString(JwtClaimNames.SUB);
            }
        } else if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        } else if (principal instanceof String principalStr && !principalStr.isBlank()) {
            return principalStr;
        }

        if (authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }

        throw new AuthenticationCredentialsNotFoundException("Unable to extract user identifier from security principal");
    }

    /**
     * Extracts the active user's unique identifier as a UUID.
     *
     * @return UUID representation of the user ID
     * @throws IllegalArgumentException if the extracted subject cannot be parsed as a UUID
     */
    public UUID getCurrentUserUuid() {
        String userIdStr = getCurrentUserId();
        try {
            return UUID.fromString(userIdStr);
        } catch (IllegalArgumentException ex) {
            log.error("Authenticated user ID '{}' is not a valid UUID format", userIdStr);
            throw new IllegalArgumentException("Authenticated user identifier is not a valid UUID: " + userIdStr, ex);
        }
    }

    /**
     * Safely retrieves the active Jwt token from the principal.
     *
     * @return active Jwt token
     * @throws AuthenticationCredentialsNotFoundException if the principal is not a Jwt
     */
    public Jwt getCurrentJwt() {
        Authentication authentication = getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            return jwt;
        }

        log.error("Principal in security context is of type {}, expected Jwt", 
                principal != null ? principal.getClass().getName() : "null");
        throw new AuthenticationCredentialsNotFoundException("Security principal is not an OAuth2/OIDC JWT token");
    }

    /**
     * Optional accessor for the active Jwt token.
     */
    public Optional<Jwt> getCurrentJwtOptional() {
        try {
            return Optional.of(getCurrentJwt());
        } catch (AuthenticationCredentialsNotFoundException ex) {
            return Optional.empty();
        }
    }

    /**
     * Safely retrieves a specific claim from the current JWT token.
     *
     * @param claimName name of the JWT claim
     * @param <T>       expected claim type
     * @return claim value or null if not present
     */
    @SuppressWarnings("unchecked")
    public <T> T getClaim(String claimName) {
        Jwt jwt = getCurrentJwt();
        if (!jwt.hasClaim(claimName)) {
            return null;
        }
        return (T) jwt.getClaims().get(claimName);
    }

    /**
     * Retrieves the preferred username / loginId claim.
     */
    public String getCurrentUsername() {
        Jwt jwt = getCurrentJwt();
        if (jwt.hasClaim("preferred_username")) {
            return jwt.getClaimAsString("preferred_username");
        }
        return getCurrentUserId();
    }

    /**
     * Retrieves the email claim.
     */
    public String getCurrentEmail() {
        Jwt jwt = getCurrentJwt();
        return jwt.getClaimAsString("email");
    }

    /**
     * Extracts all granted authorities (roles) assigned to the current authenticated user.
     *
     * @return Set of role strings (e.g. ROLE_USER, ROLE_ADMIN)
     */
    public Set<String> getCurrentUserRoles() {
        Authentication authentication = getAuthentication();
        if (authentication.getAuthorities() == null) {
            return Collections.emptySet();
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    /**
     * Checks if the authenticated user has a specific authority or role.
     *
     * @param role Authority name to check (e.g. "ROLE_ADMIN" or "ROLE_USER")
     * @return true if user holds the role
     */
    public boolean hasRole(String role) {
        return getCurrentUserRoles().contains(role);
    }
}
