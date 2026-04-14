package com.miguelsalamanca.nousbooks.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class UserBookDto {
    private String bookTitle;
    private Integer rating;
    private String status;
}
