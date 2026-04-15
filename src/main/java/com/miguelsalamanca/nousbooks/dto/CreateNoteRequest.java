package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class CreateNoteRequest {

    @NotNull
    private Long bookId;

    private String title;

    @NotBlank
    private String content;
}
