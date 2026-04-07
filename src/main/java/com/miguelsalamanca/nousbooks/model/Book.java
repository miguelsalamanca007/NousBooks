package com.miguelsalamanca.nousbooks.model;

import java.time.LocalDateTime;

import jakarta.persistence.Id;

public class Book {
    @Id
    public Long id;
    public int book;
    public int google_books_id;
    public String title;
    public String description;
    public String thumbnail;
    public LocalDateTime published_date;
}
