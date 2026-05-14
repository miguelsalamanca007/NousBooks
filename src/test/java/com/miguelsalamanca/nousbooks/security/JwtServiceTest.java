package com.miguelsalamanca.nousbooks.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.ExpiredJwtException;

class JwtServiceTest {

    private JwtService jwtService;
    private final String secret = "dGVzdC1zZWNyZXQta2V5LWZvci1qdW5pdC10ZXN0cy1uZWVkcy0zMi1ieXRlcy1taW4=";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", secret);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3_600_000L);
    }

    private UserDetails userDetails(String username) {
        return User.withUsername(username).password("x").authorities("ROLE_USER").build();
    }

    @Test
    void generateToken_andExtractUsername_roundtrip() {
        String token = jwtService.generateToken(userDetails("alice@example.com"));

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@example.com");
    }

    @Test
    void isTokenValid_returnsTrueForOwnerToken() {
        UserDetails u = userDetails("alice@example.com");
        String token = jwtService.generateToken(u);

        assertThat(jwtService.isTokenValid(token, u)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForDifferentUser() {
        String token = jwtService.generateToken(userDetails("alice@example.com"));

        assertThat(jwtService.isTokenValid(token, userDetails("bob@example.com"))).isFalse();
    }

    @Test
    void expiredToken_throwsExpiredJwtException() {
        ReflectionTestUtils.setField(jwtService, "expirationMs", -1_000L);
        String token = jwtService.generateToken(userDetails("alice@example.com"));

        assertThatThrownBy(() -> jwtService.isTokenValid(token, userDetails("alice@example.com")))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void tamperedToken_throwsOnParsing() {
        String token = jwtService.generateToken(userDetails("alice@example.com"));
        String tampered = token.substring(0, token.length() - 2) + "AA";

        assertThatThrownBy(() -> jwtService.extractUsername(tampered))
                .isInstanceOf(RuntimeException.class);
    }
}
