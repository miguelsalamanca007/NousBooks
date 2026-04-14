package com.miguelsalamanca.nousbooks.mapper;

import org.springframework.stereotype.Component;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.model.Note;

@Component
public class NoteMapper {
    
    public Note toEntity(CreateNoteRequest request) {
        Note note = new Note();
        note.setContent(request.getContent());
        return note;
    }

    public NoteDto toDto(Note note) {
        NoteDto dto = new NoteDto();
        dto.setId(note.getId());
        dto.setContent(note.getContent());
        dto.setTitle(note.getTitle());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setBookId(note.getBook() != null ? note.getBook().getId() : null);
        return dto;
    }
}
