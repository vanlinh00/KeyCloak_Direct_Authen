package com.common.auth.config;

import org.jboss.resteasy.client.jaxrs.internal.ResteasyClientBuilderImpl;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminConfig {

    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    @Value("${keycloak.admin.realm:master}")
    private String adminRealm;

    /**
     * Instantiates the Keycloak Admin Client.
     * Uses master realm admin credentials or client_credentials to manage users, roles, and sessions.
     */
    @Bean
    public Keycloak keycloakAdminClient() {
        KeycloakBuilder builder = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(adminRealm)
                .username(adminUsername)
                .password(adminPassword)
                .clientId("admin-cli")
                .resteasyClient(new ResteasyClientBuilderImpl()
                        .connectionPoolSize(20)
                        .build());

        // If client secret is provided for service account flow, can use CLIENT_CREDENTIALS:
        if (clientSecret != null && !clientSecret.isBlank() && !"admin-client-secret-placeholder".equals(clientSecret)) {
            // Alternatively can configure client credentials flow:
            // builder.grantType(OAuth2Constants.CLIENT_CREDENTIALS).clientId(clientId).clientSecret(clientSecret);
        } else {
            builder.grantType(OAuth2Constants.PASSWORD);
        }

        return builder.build();
    }

    public String getRealm() {
        return realm;
    }

    public String getServerUrl() {
        return serverUrl;
    }

    public String getClientId() {
        return clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }
}
