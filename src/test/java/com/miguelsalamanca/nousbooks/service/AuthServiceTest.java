package com.miguelsalamanca.nousbooks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.GeneralSecurityException;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.miguelsalamanca.nousbooks.dto.AuthResponse;
import com.miguelsalamanca.nousbooks.dto.GoogleAuthRequest;
import com.miguelsalamanca.nousbooks.dto.LoginRequest;
import com.miguelsalamanca.nousbooks.dto.RegisterRequest;
import com.miguelsalamanca.nousbooks.enums.Role;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.UserRepository;
import com.miguelsalamanca.nousbooks.security.JwtService;
import com.miguelsalamanca.nousbooks.support.TestData;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private GoogleIdTokenVerifier googleIdTokenVerifier;

    @InjectMocks private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("alice@example.com");
        registerRequest.setPassword("hunter22!");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("alice@example.com");
        loginRequest.setPassword("hunter22!");
    }

    // ── register ────────────────────────────────────────────────────────────

    @Test
    void register_persistsNewUserAndReturnsToken() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("hunter22!")).thenReturn("ENCODED");
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response.getToken()).isEqualTo("jwt-token");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("alice@example.com");
        assertThat(saved.getPassword()).isEqualTo("ENCODED");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void register_rejectsDuplicateEmail() {
        when(userRepository.findByEmail("alice@example.com"))
                .thenReturn(Optional.of(TestData.user(1L, "alice@example.com")));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email is already in use");

        verify(userRepository, never()).save(any());
        verify(jwtService, never()).generateToken(any());
    }

    // ── login ───────────────────────────────────────────────────────────────

    @Test
    void login_authenticatesAndReturnsToken() {
        User user = TestData.user(1L, "alice@example.com");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        ArgumentCaptor<UsernamePasswordAuthenticationToken> tokenCaptor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(tokenCaptor.capture());
        assertThat(tokenCaptor.getValue().getPrincipal()).isEqualTo("alice@example.com");
        assertThat(tokenCaptor.getValue().getCredentials()).isEqualTo("hunter22!");
    }

    @Test
    void login_bubblesUpBadCredentials() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("nope"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void login_throws401WhenUserVanishesAfterAuthentication() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ResponseStatusException.class);
    }

    // ── googleLogin ─────────────────────────────────────────────────────────

    @Test
    void googleLogin_returnsTokenForExistingGoogleUser() throws Exception {
        GoogleAuthRequest request = googleRequest("good-id-token");
        GoogleIdToken token = stubGoogleToken("google-sub-123", "alice@example.com", "Alice", true);
        when(googleIdTokenVerifier.verify("good-id-token")).thenReturn(token);

        User user = TestData.user(1L, "alice@example.com");
        user.setGoogleId("google-sub-123");
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt");

        AuthResponse response = authService.googleLogin(request);

        assertThat(response.getToken()).isEqualTo("jwt");
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLogin_linksGoogleIdToExistingEmailAccount() throws Exception {
        GoogleAuthRequest request = googleRequest("good-id-token");
        GoogleIdToken token = stubGoogleToken("google-sub-123", "alice@example.com", "Alice", true);
        when(googleIdTokenVerifier.verify("good-id-token")).thenReturn(token);

        User existing = TestData.user(1L, "alice@example.com"); // no googleId
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(jwtService.generateToken(existing)).thenReturn("jwt");

        AuthResponse response = authService.googleLogin(request);

        assertThat(response.getToken()).isEqualTo("jwt");
        assertThat(existing.getGoogleId()).isEqualTo("google-sub-123");
        assertThat(existing.getName()).isEqualTo("Alice");
    }

    @Test
    void googleLogin_doesNotClobberExistingName() throws Exception {
        GoogleAuthRequest request = googleRequest("good-id-token");
        GoogleIdToken token = stubGoogleToken("google-sub-123", "alice@example.com", "Alice", true);
        when(googleIdTokenVerifier.verify("good-id-token")).thenReturn(token);

        User existing = TestData.user(1L, "alice@example.com");
        existing.setName("Custom Name");
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(jwtService.generateToken(existing)).thenReturn("jwt");

        authService.googleLogin(request);

        assertThat(existing.getName()).isEqualTo("Custom Name");
    }

    @Test
    void googleLogin_createsBrandNewOAuthUser() throws Exception {
        GoogleAuthRequest request = googleRequest("good-id-token");
        GoogleIdToken token = stubGoogleToken("google-sub-new", "bob@example.com", "Bob", true);
        when(googleIdTokenVerifier.verify("good-id-token")).thenReturn(token);

        when(userRepository.findByGoogleId("google-sub-new")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-new");

        AuthResponse response = authService.googleLogin(request);

        assertThat(response.getToken()).isEqualTo("jwt-new");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("bob@example.com");
        assertThat(saved.getGoogleId()).isEqualTo("google-sub-new");
        assertThat(saved.getName()).isEqualTo("Bob");
        assertThat(saved.getPassword()).isNull();
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void googleLogin_rejectsUnverifiedEmail() throws Exception {
        GoogleAuthRequest request = googleRequest("token");
        GoogleIdToken token = stubGoogleToken("sub", "x@y.com", "X", false);
        when(googleIdTokenVerifier.verify("token")).thenReturn(token);

        assertThatThrownBy(() -> authService.googleLogin(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not verified");
    }

    @Test
    void googleLogin_rejectsInvalidTokenWhenVerifierReturnsNull() throws Exception {
        GoogleAuthRequest request = googleRequest("bad");
        when(googleIdTokenVerifier.verify("bad")).thenReturn(null);

        assertThatThrownBy(() -> authService.googleLogin(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid Google token");
    }

    @Test
    void googleLogin_wrapsVerificationExceptionsAs401() throws Exception {
        GoogleAuthRequest request = googleRequest("bad");
        when(googleIdTokenVerifier.verify(eq("bad")))
                .thenThrow(new GeneralSecurityException("boom"));

        assertThatThrownBy(() -> authService.googleLogin(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Could not verify Google token");
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private GoogleAuthRequest googleRequest(String idToken) {
        GoogleAuthRequest r = new GoogleAuthRequest();
        r.setIdToken(idToken);
        return r;
    }

    private GoogleIdToken stubGoogleToken(String sub, String email, String name, boolean verified) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setSubject(sub);
        payload.setEmail(email);
        payload.set("name", name);
        payload.setEmailVerified(verified);

        // header + signature + bytes args are not inspected by AuthService.
        return new GoogleIdToken(
                new com.google.api.client.json.webtoken.JsonWebSignature.Header(),
                payload,
                new byte[0],
                new byte[0]);
    }
}
