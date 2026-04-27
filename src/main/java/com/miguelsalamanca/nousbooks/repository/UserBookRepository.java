package com.miguelsalamanca.nousbooks.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.miguelsalamanca.nousbooks.model.UserBook;

@Repository
public interface UserBookRepository extends JpaRepository<UserBook, Long> {

    // EntityGraph forces a JOIN FETCH on `book` so the mapper doesn't trigger
    // an N+1 cascade when serializing the list to DTOs.
    @EntityGraph(attributePaths = "book")
    List<UserBook> findByUserId(Long userId);

    List<UserBook> findByBookId(Long bookId);

    @EntityGraph(attributePaths = "book")
    Optional<UserBook> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndBookId(Long userId, Long bookId);
}
