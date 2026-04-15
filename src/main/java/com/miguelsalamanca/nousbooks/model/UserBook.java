package com.miguelsalamanca.nousbooks.model;

import java.time.LocalDateTime;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_books", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "book_id"})
})

@Getter @Setter @NoArgsConstructor
public class UserBook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn (name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn (name = "book_id")
    private Book book;

    @Enumerated(EnumType.STRING)
    private ReadingStatus status;
    private Integer rating;
    @Column(length = 2000)
    private String review;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
