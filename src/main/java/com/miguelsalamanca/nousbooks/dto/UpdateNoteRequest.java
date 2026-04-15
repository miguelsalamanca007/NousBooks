package com.miguelsalamanca.nousbooks.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class UpdateNoteRequest {

    private String title;

    // null = don't update; "" is rejected
    @Size(min = 1, message = "must not be blank")
    private String content;
}
