package com.miguelsalamanca.nousbooks.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

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
import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.mapper.UserBookMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.security.JwtAuthFilter;
import com.miguelsalamanca.nousbooks.service.UserBookService;
import com.miguelsalamanca.nousbooks.support.TestData;
import com.miguelsalamanca.nousbooks.support.TestSecurityConfig;

@WebMvcTest(
        controllers = UserBookController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@Import(TestSecurityConfig.class)
class UserBookControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private UserBookService userBookService;
    @MockitoBean private UserBookMapper userBookMapper;
    @MockitoBean private UserDetailsService userDetailsService;

    private User currentUser;
    private Book book;

    @BeforeEach
    void setUp() {
        currentUser = TestData.user(1L, "alice@example.com");
        book = TestData.book(10L, "g1", "Book A");
    }

    @Test
    void create_returnsDto() throws Exception {
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");
        req.setStatus(ReadingStatus.READING);

        UserBook saved = TestData.userBook(7L, currentUser, book, ReadingStatus.READING);
        when(userBookService.createUserBook(any(CreateUserBookRequest.class), any(User.class)))
                .thenReturn(saved);

        UserBookDto dto = new UserBookDto();
        dto.setId(7L);
        dto.setStatus("READING");
        when(userBookMapper.toDto(saved)).thenReturn(dto);

        mockMvc.perform(post("/api/user-books")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("READING"));
    }

    @Test
    void create_returns400WhenGoogleBooksIdMissing() throws Exception {
        CreateUserBookRequest req = new CreateUserBookRequest();

        mockMvc.perform(post("/api/user-books")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_returns409WhenAlreadyInLibrary() throws Exception {
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");
        when(userBookService.createUserBook(any(CreateUserBookRequest.class), any(User.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "already in your library"));

        mockMvc.perform(post("/api/user-books")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("already in your library"));
    }

    @Test
    void getMyBooks_returnsList() throws Exception {
        UserBook ub = TestData.userBook(1L, currentUser, book, ReadingStatus.READING);
        when(userBookService.getMyBooks(any(User.class))).thenReturn(List.of(ub));

        UserBookDto dto = new UserBookDto();
        dto.setId(1L);
        when(userBookMapper.toDto(ub)).thenReturn(dto);

        mockMvc.perform(get("/api/user-books/me").with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void update_patchesAndReturnsDto() throws Exception {
        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setStatus(ReadingStatus.READ);

        UserBook updated = TestData.userBook(1L, currentUser, book, ReadingStatus.READ);
        when(userBookService.updateUserBook(eq(1L), any(UpdateUserBookRequest.class), any(User.class)))
                .thenReturn(updated);

        UserBookDto dto = new UserBookDto();
        dto.setId(1L);
        dto.setStatus("READ");
        when(userBookMapper.toDto(updated)).thenReturn(dto);

        mockMvc.perform(patch("/api/user-books/1")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READ"));
    }

    @Test
    void update_returns400ForInvalidRating() throws Exception {
        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setRating(10);

        mockMvc.perform(patch("/api/user-books/1")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void delete_returns204AndCallsService() throws Exception {
        mockMvc.perform(delete("/api/user-books/1").with(user(currentUser)))
                .andExpect(status().isNoContent());

        verify(userBookService).deleteUserBook(eq(1L), any(User.class));
    }
}
