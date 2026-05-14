package com.miguelsalamanca.nousbooks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateNoteRequest;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.BookRepository;
import com.miguelsalamanca.nousbooks.repository.NoteRepository;
import com.miguelsalamanca.nousbooks.support.TestData;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock private NoteRepository noteRepository;
    @Mock private BookRepository bookRepository;
    @Mock private NoteMapper noteMapper;
    @InjectMocks private NoteService noteService;

    private User user;
    private Book book;

    @BeforeEach
    void setUp() {
        user = TestData.user(1L, "alice@example.com");
        book = TestData.book(10L, "g1", "Book A");
    }

    @Test
    void createNote_setsUserAndBookFromRequest() {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setBookId(10L);
        req.setTitle("t");
        req.setContent("c");

        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));
        Note newNote = new Note();
        newNote.setTitle("t");
        newNote.setContent("c");
        when(noteMapper.toEntity(req)).thenReturn(newNote);
        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

        Note saved = noteService.createNote(req, user);

        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getBook()).isSameAs(book);
        assertThat(saved.getTitle()).isEqualTo("t");
        assertThat(saved.getContent()).isEqualTo("c");
    }

    @Test
    void createNote_throws404WhenBookMissing() {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setBookId(404L);
        when(bookRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> noteService.createNote(req, user))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Book not found");
        verify(noteRepository, never()).save(any());
    }

    @Test
    void getMyNotes_delegatesToRepositoryFilteredByUser() {
        List<Note> list = List.of(TestData.note(1L, user, book, "t", "c"));
        when(noteRepository.findByUserId(1L)).thenReturn(list);

        assertThat(noteService.getMyNotes(user)).isSameAs(list);
    }

    @Test
    void getMyNotesByBook_filtersByUserAndBook() {
        when(noteRepository.findByUserIdAndBookId(1L, 10L)).thenReturn(List.of());

        assertThat(noteService.getMyNotesByBook(10L, user)).isEmpty();
    }

    @Test
    void getNote_returnsWhenOwned() {
        Note note = TestData.note(7L, user, book, "t", "c");
        when(noteRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(note));

        assertThat(noteService.getNote(7L, user)).isSameAs(note);
    }

    @Test
    void getNote_throws404WhenNotOwned() {
        when(noteRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> noteService.getNote(7L, user))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void updateNote_patchesProvidedFields() {
        Note existing = TestData.note(7L, user, book, "old-title", "old-content");
        when(noteRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(existing));
        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateNoteRequest req = new UpdateNoteRequest();
        req.setTitle("new-title");

        Note updated = noteService.updateNote(7L, req, user);

        assertThat(updated.getTitle()).isEqualTo("new-title");
        assertThat(updated.getContent()).isEqualTo("old-content");
    }

    @Test
    void updateNote_throws404WhenMissing() {
        when(noteRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> noteService.updateNote(99L, new UpdateNoteRequest(), user))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void deleteNote_deletesWhenOwned() {
        Note note = TestData.note(7L, user, book, "t", "c");
        when(noteRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(note));

        noteService.deleteNote(7L, user);

        verify(noteRepository).delete(note);
    }

    @Test
    void deleteNote_throws404WhenMissing() {
        when(noteRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> noteService.deleteNote(7L, user))
                .isInstanceOf(ResponseStatusException.class);
        verify(noteRepository, never()).delete(any());
    }
}
