package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class CreateHighlightRequest {

    @NotNull
    private Long bookId;

    // Size cap protects against a malicious or buggy client pushing huge
    // payloads into the embedding pipeline (which we'd otherwise pay for).
    @NotBlank
    @Size(max = 5000)
    private String text;

    @Size(max = 2000)
    private String note;

    @Positive
    private Integer pageNumber;
}
