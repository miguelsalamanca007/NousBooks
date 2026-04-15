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
}
