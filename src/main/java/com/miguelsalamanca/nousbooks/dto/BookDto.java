package com.miguelsalamanca.nousbooks.dto;

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
    private String publishedDate;
    private Integer pageCount;
}
