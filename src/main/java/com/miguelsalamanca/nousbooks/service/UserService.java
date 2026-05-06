package com.miguelsalamanca.nousbooks.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.ChangePasswordRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserRequest;
import com.miguelsalamanca.nousbooks.dto.UserDto;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserDto getMe(User principal) {
        // Re-read from the DB so we get the freshest state — `principal`
        // came from the JWT and may be stale after the user updated their
        // own profile in another tab.
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return toDto(user);
    }

    public UserDto updateMe(User principal, UpdateUserRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        if (request.getName() != null) {
            // Treat blank string as "clear the name". Trim whitespace so a
            // user can't accidentally save "  " as a display name.
            String trimmed = request.getName().trim();
            user.setName(trimmed.isEmpty() ? null : trimmed);
        }

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            // Block email collisions explicitly — relying on the unique
            // constraint would surface as a 500 from the database, which is
            // a worse user experience than a clear 409.
            userRepository.findByEmail(request.getEmail()).ifPresent(other -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
            });
            user.setEmail(request.getEmail());
        }

        return toDto(userRepository.save(user));
    }

    public void changePassword(User principal, ChangePasswordRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        boolean alreadyHasPassword = user.getPassword() != null;

        // If the account already has a password, the user must prove they
        // know it before changing — otherwise a stolen JWT would be enough
        // to take over the account permanently.
        if (alreadyHasPassword) {
            if (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
            }
        }
        // OAuth-only accounts (no password yet) can set their first password
        // without supplying a current one; their JWT is enough proof.

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .hasPassword(user.getPassword() != null)
                .hasGoogle(user.getGoogleId() != null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
