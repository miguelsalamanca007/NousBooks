package com.miguelsalamanca.nousbooks.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miguelsalamanca.nousbooks.config.SecurityConfig;
import com.miguelsalamanca.nousbooks.dto.ChangePasswordRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserRequest;
import com.miguelsalamanca.nousbooks.dto.UserDto;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.security.JwtAuthFilter;
import com.miguelsalamanca.nousbooks.service.UserService;
import com.miguelsalamanca.nousbooks.support.TestData;
import com.miguelsalamanca.nousbooks.support.TestSecurityConfig;

@WebMvcTest(
        controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@Import(TestSecurityConfig.class)
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private UserService userService;
    @MockitoBean private UserDetailsService userDetailsService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = TestData.user(1L, "alice@example.com");
    }

    @Test
    void me_returnsCurrentUserDto() throws Exception {
        UserDto dto = UserDto.builder()
                .id(1L)
                .email("alice@example.com")
                .hasPassword(true)
                .hasGoogle(false)
                .build();
        when(userService.getMe(any(User.class))).thenReturn(dto);

        mockMvc.perform(get("/api/users/me").with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.hasPassword").value(true));
    }

    @Test
    void update_returnsUpdatedDto() throws Exception {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("Alice");
        UserDto dto = UserDto.builder().id(1L).email("alice@example.com").name("Alice").build();
        when(userService.updateMe(any(User.class), any(UpdateUserRequest.class))).thenReturn(dto);

        mockMvc.perform(patch("/api/users/me")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    void update_returns400WhenEmailInvalid() throws Exception {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setEmail("not-an-email");

        mockMvc.perform(patch("/api/users/me")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changePassword_returns204() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("old");
        req.setNewPassword("brand-new-pw");

        mockMvc.perform(post("/api/users/me/password")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNoContent());

        verify(userService).changePassword(any(User.class), any(ChangePasswordRequest.class));
    }

    @Test
    void changePassword_returns400OnShortPassword() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setNewPassword("short");

        mockMvc.perform(post("/api/users/me/password")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.newPassword").exists());
    }

    @Test
    void changePassword_returns401OnWrongCurrent() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("wrong");
        req.setNewPassword("brand-new-pw");
        org.mockito.Mockito.doThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect"))
                .when(userService).changePassword(any(User.class), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/users/me/password")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }
}
