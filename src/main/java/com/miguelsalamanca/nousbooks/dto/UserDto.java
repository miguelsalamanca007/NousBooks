package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * What we return to the frontend about the current user. Deliberately omits
 * password (never readable), googleId (internal linkage), and role (not yet
 * surfaced in the UI).
 */
@Getter
@Builder
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private boolean hasPassword;
    private boolean hasGoogle;
    private LocalDateTime createdAt;
}
