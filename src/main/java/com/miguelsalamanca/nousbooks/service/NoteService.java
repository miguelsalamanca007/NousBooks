package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.NoteRepository;
import com.miguelsalamanca.nousbooks.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import com.miguelsalamanca.nousbooks.repository.BookRepository;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final BookRepository bookRepository;
    private final NoteMapper noteMapper;
    private final UserRepository userRepository;

    public Note createNote(CreateNoteRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        Note note = noteMapper.toEntity(request);
        note.setBook(book);
        note.setUser(user);

        return noteRepository.save(note);
    }

    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    public List<Note> getNotesByBook(Long bookId) {
        return noteRepository.findByBookId(bookId);
    }
}
