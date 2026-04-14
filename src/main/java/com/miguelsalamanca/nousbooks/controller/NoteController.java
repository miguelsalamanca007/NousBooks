package com.miguelsalamanca.nousbooks.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.service.NoteService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final NoteMapper noteMapper;

    @PostMapping
    public NoteDto create(@RequestBody CreateNoteRequest request) {
        Note saved = noteService.createNote(request);
        return noteMapper.toDto(saved);
    }

    @GetMapping
    public List<NoteDto> getAll() {
        return noteService.getAllNotes()
                .stream()
                .map(noteMapper::toDto)
                .toList();
    }

    @GetMapping("/by-book/{bookId}")
    public List<NoteDto> getNotesByBook(@PathVariable Long bookId) {
        return noteService.getNotesByBook(bookId)
                .stream()
                .map(noteMapper::toDto)
                .toList();
}
    
}
