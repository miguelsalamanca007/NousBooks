package com.miguelsalamanca.nousbooks.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.ChangePasswordRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserRequest;
import com.miguelsalamanca.nousbooks.dto.UserDto;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Self-service endpoints for the currently authenticated user. All routes
 * below are scoped to the JWT-bearer's own account; there is intentionally
 * no way to act on another user's id from here.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal User principal) {
        return ResponseEntity.ok(userService.getMe(principal));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserDto> update(
            @AuthenticationPrincipal User principal,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateMe(principal, request));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal, request);
        return ResponseEntity.noContent().build();
    }
}
