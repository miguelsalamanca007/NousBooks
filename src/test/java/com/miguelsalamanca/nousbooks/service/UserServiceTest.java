package com.miguelsalamanca.nousbooks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.ChangePasswordRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserRequest;
import com.miguelsalamanca.nousbooks.dto.UserDto;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.UserRepository;
import com.miguelsalamanca.nousbooks.support.TestData;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = TestData.user(1L, "alice@example.com");
    }

    @Test
    void getMe_returnsDtoFromFreshDbRead() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserDto dto = userService.getMe(user);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getEmail()).isEqualTo("alice@example.com");
        assertThat(dto.isHasPassword()).isTrue();
        assertThat(dto.isHasGoogle()).isFalse();
    }

    @Test
    void getMe_throws401WhenUserDeleted() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getMe(user))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void updateMe_changesNameAndEmail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("Alice");
        req.setEmail("new@example.com");

        UserDto dto = userService.updateMe(user, req);

        assertThat(dto.getName()).isEqualTo("Alice");
        assertThat(dto.getEmail()).isEqualTo("new@example.com");
    }

    @Test
    void updateMe_trimsWhitespaceAndClearsBlankName() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("   ");

        UserDto dto = userService.updateMe(user, req);

        assertThat(dto.getName()).isNull();
    }

    @Test
    void updateMe_throws409OnEmailCollision() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("taken@example.com"))
                .thenReturn(Optional.of(TestData.user(2L, "taken@example.com")));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setEmail("taken@example.com");

        assertThatThrownBy(() -> userService.updateMe(user, req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already in use");
    }

    @Test
    void updateMe_allowsKeepingSameEmailCaseInsensitively() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setEmail("ALICE@example.com");

        UserDto dto = userService.updateMe(user, req);

        // No collision check is performed for the user's own email, and the
        // value isn't rewritten.
        assertThat(dto.getEmail()).isEqualTo("alice@example.com");
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void changePassword_requiresCurrentPasswordWhenSet() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("wrong");
        req.setNewPassword("brand-new-pw");

        assertThatThrownBy(() -> userService.changePassword(user, req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void changePassword_updatesWhenCurrentMatches() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("ok", user.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("brand-new-pw")).thenReturn("ENCODED");

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("ok");
        req.setNewPassword("brand-new-pw");

        userService.changePassword(user, req);

        assertThat(user.getPassword()).isEqualTo("ENCODED");
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_allowsOAuthOnlyUserToSetFirstPasswordWithoutCurrent() {
        user.setPassword(null);
        user.setGoogleId("google-sub");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("brand-new-pw")).thenReturn("ENCODED");

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setNewPassword("brand-new-pw");

        userService.changePassword(user, req);

        assertThat(user.getPassword()).isEqualTo("ENCODED");
        verify(passwordEncoder, never()).matches(any(), any());
    }
}
