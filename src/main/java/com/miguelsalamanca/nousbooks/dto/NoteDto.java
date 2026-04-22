package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class NoteDto {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private Long bookId;
    private String bookTitle;
    private String content;
}
