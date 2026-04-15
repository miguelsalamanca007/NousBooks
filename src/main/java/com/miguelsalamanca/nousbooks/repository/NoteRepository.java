package com.miguelsalamanca.nousbooks.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.miguelsalamanca.nousbooks.model.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long>{
    List<Note> findByBookId(Long bookId);
    List<Note> findByUserId(Long userId);
    List<Note> findByUserIdAndBookId(Long userId, Long bookId);
    Optional<Note> findByIdAndUserId(Long id, Long userId);
}
