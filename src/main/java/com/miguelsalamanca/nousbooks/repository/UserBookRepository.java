package com.miguelsalamanca.nousbooks.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
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

    // ── Stats aggregates ────────────────────────────────────────────────────

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, ReadingStatus status);

    /**
     * Returns rows of [year, month, count] for books the user finished after
     * {@code since}. We aggregate in SQL rather than streaming all rows into
     * memory because the user's library can grow unbounded over time, while
     * the stats page only needs 12 buckets.
     *
     * <p>{@code extract(... from ...)} is part of standard HQL and is
     * translated by Hibernate to the dialect-appropriate function on both
     * H2 (dev) and PostgreSQL (prod).
     */
    @Query("""
            SELECT EXTRACT(YEAR FROM ub.finishedAt),
                   EXTRACT(MONTH FROM ub.finishedAt),
                   COUNT(ub.id)
              FROM UserBook ub
             WHERE ub.user.id = :userId
               AND ub.finishedAt IS NOT NULL
               AND ub.finishedAt >= :since
          GROUP BY EXTRACT(YEAR FROM ub.finishedAt),
                   EXTRACT(MONTH FROM ub.finishedAt)
            """)
    List<Object[]> countFinishedByMonth(@Param("userId") Long userId,
                                        @Param("since") LocalDateTime since);
}
