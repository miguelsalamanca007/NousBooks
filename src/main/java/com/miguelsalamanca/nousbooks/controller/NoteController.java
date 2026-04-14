package com.miguelsalamanca.nousbooks.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.service.NoteService;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public NoteDto create(@RequestBody CreateNoteRequest request) {
        Note saved = noteService.createNote(request);
        return NoteMapper.toDto(saved);
    }

    @GetMapping
    public List<NoteDto> getAll() {
        return noteService.getAllNotes()
                .stream()
                .map(NoteMapper::toDto)
                .toList();
    }

    @GetMapping("/by-book/{bookId}")
    public List<NoteDto> getNotesByBook(@PathVariable Long bookId) {
        return noteService.getNotesByBook(bookId)
                .stream()
                .map(NoteMapper::toDto)
                .toList();
}
    
}
