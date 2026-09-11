package com.common.auth.exception;

public class KeycloakIntegrationException extends RuntimeException {

    private final int statusCode;

    public KeycloakIntegrationException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public KeycloakIntegrationException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
