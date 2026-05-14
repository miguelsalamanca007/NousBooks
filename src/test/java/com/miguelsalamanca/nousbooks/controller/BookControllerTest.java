package com.miguelsalamanca.nousbooks.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miguelsalamanca.nousbooks.config.SecurityConfig;
import com.miguelsalamanca.nousbooks.dto.BookSearchRequest;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.mapper.BookMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.security.JwtAuthFilter;
import com.miguelsalamanca.nousbooks.service.BookService;
import com.miguelsalamanca.nousbooks.support.TestData;
import com.miguelsalamanca.nousbooks.support.TestSecurityConfig;

@WebMvcTest(
        controllers = BookController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@Import(TestSecurityConfig.class)
class BookControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private BookService bookService;
    @MockitoBean private BookMapper bookMapper;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void search_returnsResultsFromGoogleBooksClient() throws Exception {
        BookSearchResultDto result = new BookSearchResultDto();
        result.setGoogleBooksId("g1");
        result.setTitle("Hobbit");
        when(bookService.search(any(BookSearchRequest.class))).thenReturn(List.of(result));

        mockMvc.perform(get("/api/books/search").param("q", "hobbit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].googleBooksId").value("g1"))
                .andExpect(jsonPath("$[0].title").value("Hobbit"));
    }

    @Test
    void getBookById_returns200WithDto() throws Exception {
        Book book = TestData.book(5L, "g5", "Title");
        when(bookService.findById(5L)).thenReturn(Optional.of(book));
        com.miguelsalamanca.nousbooks.dto.BookDto dto = new com.miguelsalamanca.nousbooks.dto.BookDto();
        dto.setId(5L);
        dto.setTitle("Title");
        when(bookMapper.toDto(book)).thenReturn(dto);

        mockMvc.perform(get("/api/books/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.title").value("Title"));
    }

    @Test
    void getBookById_returns404WhenMissing() throws Exception {
        when(bookService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/books/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Book not found"));
    }

    @Test
    void create_forbiddenForRegularUser() throws Exception {
        CreateBookRequest req = new CreateBookRequest();
        req.setGoogleBooksId("g1");

        mockMvc.perform(post("/api/books")
                        .with(user(TestData.user(1L, "u@x.com")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_allowedForAdmin() throws Exception {
        CreateBookRequest req = new CreateBookRequest();
        req.setGoogleBooksId("g1");
        req.setTitle("Title");
        Book saved = TestData.book(1L, "g1", "Title");
        when(bookService.createBook(any(CreateBookRequest.class))).thenReturn(saved);
        com.miguelsalamanca.nousbooks.dto.BookDto dto = new com.miguelsalamanca.nousbooks.dto.BookDto();
        dto.setId(1L);
        dto.setTitle("Title");
        when(bookMapper.toDto(saved)).thenReturn(dto);

        mockMvc.perform(post("/api/books")
                        .with(user(TestData.adminUser(99L, "admin@x.com")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getAll_forbiddenForRegularUser() throws Exception {
        mockMvc.perform(get("/api/books")
                        .with(user(TestData.user(1L, "u@x.com"))))
                .andExpect(status().isForbidden());
    }
}
