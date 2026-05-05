package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Partial update for the current user's profile. Any field left as null is
 * not touched — this lets the frontend send only the fields that changed.
 */
@Getter @Setter @NoArgsConstructor
public class UpdateUserRequest {

    // null = don't update; "" or whitespace clears the name back to null.
    @Size(max = 80, message = "must be at most 80 characters")
    private String name;

    @Email(message = "must be a valid email")
    private String email;
}
