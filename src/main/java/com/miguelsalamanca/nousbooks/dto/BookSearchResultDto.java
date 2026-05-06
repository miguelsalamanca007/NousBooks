package com.miguelsalamanca.nousbooks.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class BookSearchResultDto {
    private String googleBooksId;
    private String title;
    private List<String> authors;
    private String description;
    private String thumbnail;
    private String publishedDate;
    private Integer pageCount;
}
