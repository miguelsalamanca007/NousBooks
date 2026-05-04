package com.miguelsalamanca.nousbooks.config;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

/**
 * Wires up Google's ID token verifier as a singleton bean.
 *
 * <p>The verifier downloads Google's public keys (cached internally) and
 * checks the token signature, expiration, and audience on every call. Setting
 * {@code setAudience} ensures we only accept tokens minted for our specific
 * OAuth client — tokens from other Google apps will be rejected.
 */
@Configuration
public class GoogleOAuthConfig {

    @Value("${app.google-oauth.client-id:}")
    private String clientId;

    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier() {
        return new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }
}
