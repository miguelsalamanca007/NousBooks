package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for {@code POST /api/auth/google}.
 *
 * <p>The frontend obtains the {@code idToken} from Google Identity Services
 * after the user signs in, and forwards it here so the backend can verify it
 * and issue our own JWT.
 */
@Getter @Setter @NoArgsConstructor
public class GoogleAuthRequest {

    @NotBlank
    private String idToken;
}
