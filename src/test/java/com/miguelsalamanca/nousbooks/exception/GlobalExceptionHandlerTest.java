package com.miguelsalamanca.nousbooks.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.RegisterRequest;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @SuppressWarnings("unchecked")
    void handleValidation_returnsFieldErrorMap() throws Exception {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new RegisterRequest(), "registerRequest");
        result.addError(new FieldError("registerRequest", "email", "must not be blank"));
        result.addError(new FieldError("registerRequest", "password", "must be at least 8 characters"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(
                new org.springframework.core.MethodParameter(
                        GlobalExceptionHandlerTest.class.getDeclaredMethod("dummy", String.class), 0),
                result);

        Map<String, Object> body = handler.handleValidation(ex);

        Map<String, String> errors = (Map<String, String>) body.get("errors");
        assertThat(errors).containsEntry("email", "must not be blank");
        assertThat(errors).containsEntry("password", "must be at least 8 characters");
    }

    @Test
    void handleResponseStatus_propagatesStatusAndReason() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.CONFLICT, "duplicate");

        ResponseEntity<Map<String, String>> response = handler.handleResponseStatus(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("message", "duplicate");
    }

    @Test
    void handleAuthentication_returnsGenericMessage() {
        Map<String, String> body = handler.handleAuthentication(new BadCredentialsException("wrong"));
        assertThat(body).containsEntry("message", "Invalid email or password");
    }

    @Test
    void handleAccessDenied_returnsAccessDeniedMessage() {
        Map<String, String> body = handler.handleAccessDenied(new AccessDeniedException("nope"));
        assertThat(body).containsEntry("message", "Access denied");
    }

    @Test
    void handleUnexpected_returnsGenericMessage() {
        Map<String, String> body = handler.handleUnexpected(new RuntimeException("boom"));
        assertThat(body).containsEntry("message", "Something went wrong");
    }

    @SuppressWarnings("unused")
    private void dummy(String x) { /* reflection target for MethodArgumentNotValidException */ }

    // Defensive — silence unused-import warnings for List on some IDEs.
    @SuppressWarnings("unused")
    private static List<String> unused;
}
