package com.miguelsalamanca.nousbooks.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "books")
@Getter @Setter @NoArgsConstructor
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String googleBooksId;
    @Column(length = 500)
    private String title;
    @Column(length = 2000)
    private String description;
    @Column(columnDefinition = "TEXT")
    private String thumbnail;
    private String publishedDate;
}
