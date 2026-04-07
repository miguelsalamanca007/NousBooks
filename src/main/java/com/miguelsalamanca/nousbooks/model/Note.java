package com.miguelsalamanca.nousbooks.model;

import java.time.LocalDateTime;

import jakarta.persistence.Id;

public class Note {
    @Id
    public Long id;
    public int user_id;
    public int book_id;
    public String title;
    public String content;
    public LocalDateTime created_at;
}
