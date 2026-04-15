package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class CreateUserBookRequest {
    private Long bookId;
    private ReadingStatus status;
    private Integer rating;
    private String review;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
