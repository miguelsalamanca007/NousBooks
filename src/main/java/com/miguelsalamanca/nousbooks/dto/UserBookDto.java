package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class UserBookDto {
    private Long id;
    private BookDto book;
    private String status;
    private Integer rating;
    private String review;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
