package com.miguelsalamanca.nousbooks.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.miguelsalamanca.nousbooks.model.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByBookId(Long bookId);

    // NoteMapper accesses note.getBook().getTitle(), so eagerly join the book
    // here to avoid an N+1 query per note in the list.
    @EntityGraph(attributePaths = "book")
    List<Note> findByUserId(Long userId);

    @EntityGraph(attributePaths = "book")
    List<Note> findByUserIdAndBookId(Long userId, Long bookId);

    @EntityGraph(attributePaths = "book")
    Optional<Note> findByIdAndUserId(Long id, Long userId);
}
