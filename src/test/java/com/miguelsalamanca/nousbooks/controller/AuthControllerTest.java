package com.miguelsalamanca.nousbooks.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miguelsalamanca.nousbooks.config.SecurityConfig;
import com.miguelsalamanca.nousbooks.dto.AuthResponse;
import com.miguelsalamanca.nousbooks.dto.GoogleAuthRequest;
import com.miguelsalamanca.nousbooks.dto.LoginRequest;
import com.miguelsalamanca.nousbooks.dto.RegisterRequest;
import com.miguelsalamanca.nousbooks.security.JwtAuthFilter;
import com.miguelsalamanca.nousbooks.service.AuthService;
import com.miguelsalamanca.nousbooks.support.TestSecurityConfig;

@WebMvcTest(
        controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@Import(TestSecurityConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private AuthService authService;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void register_returns200WithToken() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("alice@example.com");
        req.setPassword("hunter22!");
        when(authService.register(any(RegisterRequest.class))).thenReturn(new AuthResponse("jwt"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"));
    }

    @Test
    void register_returns400OnInvalidPayload() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("not-an-email");
        req.setPassword("short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void login_returns200WithToken() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("hunter22!");
        when(authService.login(any(LoginRequest.class))).thenReturn(new AuthResponse("jwt"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"));
    }

    @Test
    void login_returns401OnBadCredentials() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("hunter22!");
        when(authService.login(any(LoginRequest.class))).thenThrow(new BadCredentialsException("nope"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void google_returns200WithToken() throws Exception {
        GoogleAuthRequest req = new GoogleAuthRequest();
        req.setIdToken("id-token");
        when(authService.googleLogin(any(GoogleAuthRequest.class))).thenReturn(new AuthResponse("jwt"));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"));
    }

    @Test
    void google_returns400WhenIdTokenMissing() throws Exception {
        GoogleAuthRequest req = new GoogleAuthRequest();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
