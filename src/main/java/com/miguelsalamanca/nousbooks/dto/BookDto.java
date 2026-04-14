package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class BookDto {
    private Long id;
    private String googleBooksId;
    private String title;
    private String description;
    private String thumbnail;
    private LocalDateTime publishedDate;
}
