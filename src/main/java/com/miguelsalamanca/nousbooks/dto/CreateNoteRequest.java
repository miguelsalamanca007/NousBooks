package com.miguelsalamanca.nousbooks.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class CreateNoteRequest {
    private String content;
    private Long userId;
    private Long bookId;
    private String title;
}
