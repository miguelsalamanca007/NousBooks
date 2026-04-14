package com.miguelsalamanca.nousbooks.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class CreateBookRequest {
    private int googleBooksId;
    private String title;
    private String description;
    private String thumbnail;
}
