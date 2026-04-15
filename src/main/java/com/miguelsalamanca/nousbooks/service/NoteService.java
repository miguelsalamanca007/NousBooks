package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateNoteRequest;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.BookRepository;
import com.miguelsalamanca.nousbooks.repository.NoteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final BookRepository bookRepository;
    private final NoteMapper noteMapper;

    public Note createNote(CreateNoteRequest request, User currentUser) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        Note note = noteMapper.toEntity(request);
        note.setBook(book);
        note.setUser(currentUser);
        return noteRepository.save(note);
    }

    public List<Note> getMyNotes(User currentUser) {
        return noteRepository.findByUserId(currentUser.getId());
    }

    public List<Note> getMyNotesByBook(Long bookId, User currentUser) {
        return noteRepository.findByUserIdAndBookId(currentUser.getId(), bookId);
    }

    public Note updateNote(Long id, UpdateNoteRequest request, User currentUser) {
        Note note = noteRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));

        if (request.getTitle() != null) note.setTitle(request.getTitle());
        if (request.getContent() != null) note.setContent(request.getContent());

        return noteRepository.save(note);
    }

    public void deleteNote(Long id, User currentUser) {
        Note note = noteRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));
        noteRepository.delete(note);
    }
}
