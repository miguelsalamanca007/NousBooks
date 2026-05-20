package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class UpdateHighlightRequest {

    @Size(min = 1, max = 5000)
    private String text;

    @Size(max = 2000)
    private String note;

    @Positive
    private Integer pageNumber;
}
