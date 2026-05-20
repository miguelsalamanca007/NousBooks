package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class HighlightDto {

    private Long id;
    private BookDto book;
    private String text;
    private String note;
    private Integer pageNumber;
    private LocalDateTime createdAt;

    // Populated only on semantic-search responses; null for regular listings.
    // Range is roughly [0.0, 2.0] in cosine-distance terms — 0 is a perfect
    // match. The frontend can format it however it wants (or ignore it).
    private Double relevance;
}
