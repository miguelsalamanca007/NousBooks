package com.miguelsalamanca.nousbooks.model;

import java.time.LocalDateTime;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

@Entity
public class UserBooks {
    @Id
    public Long id;
    public int user_id;
    public int book_id;
    @Enumerated(EnumType.STRING)
    public ReadingStatus status;
    public Integer rating;
    public LocalDateTime started_at;
    public LocalDateTime finished_at;
}
