package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class UpdateUserBookRequest {

    private ReadingStatus status;

    @Min(1) @Max(5)
    private Integer rating;

    private String review;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    // Reading progress. Null means "don't change". The service clamps to
    // [0, book.pageCount] (when pageCount is known) and auto-promotes the
    // status to READ when the user reaches the end.
    @Min(0)
    private Integer currentPage;

    // Lets the user supply pageCount when Google Books didn't provide one.
    // The service writes it through to the underlying Book row. Null = no
    // change (don't touch existing pageCount).
    @Min(1)
    private Integer pageCount;
}
