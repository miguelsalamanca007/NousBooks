package com.miguelsalamanca.nousbooks.mapper;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.model.Note;

public class NoteMapper {
    
    public static Note toEntity(CreateNoteRequest request) {
        Note note = new Note();
        note.setContent(request.getContent());
        return note;
    }

    public static NoteDto toDto(Note note) {
        NoteDto dto = new NoteDto();
        dto.setId(note.getId());
        dto.setContent(note.getContent());
        return dto;
    }
}
