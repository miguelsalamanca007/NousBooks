package com.miguelsalamanca.nousbooks.service;

import java.security.GeneralSecurityException;
import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.miguelsalamanca.nousbooks.dto.AuthResponse;
import com.miguelsalamanca.nousbooks.dto.GoogleAuthRequest;
import com.miguelsalamanca.nousbooks.dto.LoginRequest;
import com.miguelsalamanca.nousbooks.dto.RegisterRequest;
import com.miguelsalamanca.nousbooks.enums.Role;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.UserRepository;
import com.miguelsalamanca.nousbooks.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    /**
     * Sign in (or sign up) with a Google ID token obtained on the frontend.
     *
     * <p>The flow is:
     * <ol>
     *   <li>Verify the token's signature, expiration, and audience with Google.</li>
     *   <li>Look up the user by Google ID. If found, return a JWT.</li>
     *   <li>Otherwise, look up by email. If a password-only account exists for
     *       that email, link the Google ID to it (Google has already verified
     *       email ownership, so this is safe).</li>
     *   <li>Otherwise, create a brand new OAuth-only user (no password).</li>
     * </ol>
     */
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        GoogleIdToken token = verifyGoogleToken(request.getIdToken());
        Payload payload = token.getPayload();

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        // Defensive check: Google should always return verified emails for
        // signed-in accounts, but we double-check before trusting the email
        // for account-linking purposes.
        Boolean emailVerified = payload.getEmailVerified();
        if (emailVerified == null || !emailVerified) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email not verified");
        }

        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existing -> linkGoogleAccount(existing, googleId, name))
                        .orElseGet(() -> createGoogleUser(email, googleId, name)));

        return new AuthResponse(jwtService.generateToken(user));
    }

    private GoogleIdToken verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdToken token = googleIdTokenVerifier.verify(idTokenString);
            if (token == null) {
                // Verifier returns null when signature/expiration/audience checks fail.
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
            }
            return token;
        } catch (GeneralSecurityException | IOException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Could not verify Google token", e);
        }
    }

    private User linkGoogleAccount(User existing, String googleId, String name) {
        existing.setGoogleId(googleId);
        // Only fill in name if we don't already have one — don't clobber a
        // value the user might have set themselves later.
        if (existing.getName() == null && name != null) {
            existing.setName(name);
        }
        return userRepository.save(existing);
    }

    private User createGoogleUser(String email, String googleId, String name) {
        User user = new User();
        user.setEmail(email);
        user.setGoogleId(googleId);
        user.setName(name);
        user.setRole(Role.USER);
        // password stays null — this user authenticates via Google only.
        return userRepository.save(user);
    }
}
