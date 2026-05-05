package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class ChangePasswordRequest {

    /**
     * Required when the account already has a password (i.e. classic
     * email+password registration, or a Google account that has previously
     * set one). Optional when the account is OAuth-only and is setting its
     * first password — the service decides which case applies.
     */
    private String currentPassword;

    @NotBlank
    @Size(min = 8, message = "must be at least 8 characters")
    private String newPassword;
}
