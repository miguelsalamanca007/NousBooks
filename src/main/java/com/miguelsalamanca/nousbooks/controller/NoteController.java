package com.miguelsalamanca.nousbooks.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.dto.UpdateNoteRequest;
import com.miguelsalamanca.nousbooks.mapper.NoteMapper;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.service.NoteService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final NoteMapper noteMapper;

    @PostMapping
    public NoteDto create(@Valid @RequestBody CreateNoteRequest request,
                          @AuthenticationPrincipal User currentUser) {
        Note saved = noteService.createNote(request, currentUser);
        return noteMapper.toDto(saved);
    }

    @GetMapping
    public List<NoteDto> getAll(@AuthenticationPrincipal User currentUser) {
        return noteService.getMyNotes(currentUser)
                .stream()
                .map(noteMapper::toDto)
                .toList();
    }

    @GetMapping("/by-book/{bookId}")
    public List<NoteDto> getNotesByBook(@PathVariable Long bookId,
                                        @AuthenticationPrincipal User currentUser) {
        return noteService.getMyNotesByBook(bookId, currentUser)
                .stream()
                .map(noteMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public NoteDto getById(@PathVariable Long id,
                           @AuthenticationPrincipal User currentUser) {
        return noteMapper.toDto(noteService.getNote(id, currentUser));
    }

    @PatchMapping("/{id}")
    public NoteDto update(@PathVariable Long id,
                          @Valid @RequestBody UpdateNoteRequest request,
                          @AuthenticationPrincipal User currentUser) {
        Note updated = noteService.updateNote(id, request, currentUser);
        return noteMapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal User currentUser) {
        noteService.deleteNote(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
