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
import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.dto.UpdateNoteRequest;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.security.JwtAuthFilter;
import com.miguelsalamanca.nousbooks.service.NoteService;
import com.miguelsalamanca.nousbooks.support.TestData;
import com.miguelsalamanca.nousbooks.support.TestSecurityConfig;

@WebMvcTest(
        controllers = NoteController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@Import(TestSecurityConfig.class)
class NoteControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private NoteService noteService;
    @MockitoBean private NoteMapper noteMapper;
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
        CreateNoteRequest req = new CreateNoteRequest();
        req.setBookId(10L);
        req.setTitle("t");
        req.setContent("c");

        Note saved = TestData.note(7L, currentUser, book, "t", "c");
        when(noteService.createNote(any(CreateNoteRequest.class), any(User.class))).thenReturn(saved);

        NoteDto dto = new NoteDto();
        dto.setId(7L);
        dto.setContent("c");
        when(noteMapper.toDto(saved)).thenReturn(dto);

        mockMvc.perform(post("/api/notes")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.content").value("c"));
    }

    @Test
    void create_returns400ForMissingContent() throws Exception {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setBookId(10L);
        req.setTitle("t"); // no content

        mockMvc.perform(post("/api/notes")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.content").exists());
    }

    @Test
    void create_returns404WhenBookMissing() throws Exception {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setBookId(404L);
        req.setContent("c");
        when(noteService.createNote(any(CreateNoteRequest.class), any(User.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        mockMvc.perform(post("/api/notes")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Book not found"));
    }

    @Test
    void getAll_returnsList() throws Exception {
        Note n = TestData.note(1L, currentUser, book, "t", "c");
        when(noteService.getMyNotes(any(User.class))).thenReturn(List.of(n));

        NoteDto dto = new NoteDto();
        dto.setId(1L);
        when(noteMapper.toDto(n)).thenReturn(dto);

        mockMvc.perform(get("/api/notes").with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void getNotesByBook_returnsList() throws Exception {
        Note n = TestData.note(1L, currentUser, book, "t", "c");
        when(noteService.getMyNotesByBook(eq(10L), any(User.class))).thenReturn(List.of(n));

        NoteDto dto = new NoteDto();
        dto.setId(1L);
        when(noteMapper.toDto(n)).thenReturn(dto);

        mockMvc.perform(get("/api/notes/by-book/10").with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void getById_returnsDto() throws Exception {
        Note n = TestData.note(7L, currentUser, book, "t", "c");
        when(noteService.getNote(eq(7L), any(User.class))).thenReturn(n);
        NoteDto dto = new NoteDto();
        dto.setId(7L);
        when(noteMapper.toDto(n)).thenReturn(dto);

        mockMvc.perform(get("/api/notes/7").with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void update_returnsDto() throws Exception {
        UpdateNoteRequest req = new UpdateNoteRequest();
        req.setTitle("new");

        Note updated = TestData.note(7L, currentUser, book, "new", "c");
        when(noteService.updateNote(eq(7L), any(UpdateNoteRequest.class), any(User.class)))
                .thenReturn(updated);
        NoteDto dto = new NoteDto();
        dto.setId(7L);
        dto.setTitle("new");
        when(noteMapper.toDto(updated)).thenReturn(dto);

        mockMvc.perform(patch("/api/notes/7")
                        .with(user(currentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("new"));
    }

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/notes/7").with(user(currentUser)))
                .andExpect(status().isNoContent());

        verify(noteService).deleteNote(eq(7L), any(User.class));
    }
}
