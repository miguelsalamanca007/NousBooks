package com.miguelsalamanca.nousbooks.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class NoteDto {
    private Long id;
    private String content;
}
