package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.repository.NoteRepository;
import com.miguelsalamanca.nousbooks.repository.BookRepository;

@Service
public class NoteService {
    private final NoteRepository noteRepository;
    private final BookRepository bookRepository;

    public NoteService(NoteRepository noteRepository, BookRepository bookRepository) {
        this.noteRepository = noteRepository;
        this.bookRepository = bookRepository;
    }

    public Note createNote(CreateNoteRequest request) {
                Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        Note note = NoteMapper.toEntity(request);
        note.setBook(book);


        return noteRepository.save(note);
    }
    
    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    public List<Note> getNotesByBook(Long bookId) {
        return noteRepository.findByBookId(bookId);
    }
}
