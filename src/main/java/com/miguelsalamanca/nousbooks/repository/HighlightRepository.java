package com.miguelsalamanca.nousbooks.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.miguelsalamanca.nousbooks.model.Highlight;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {

    List<Highlight> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Highlight> findByUserIdAndBookIdOrderByPageNumberAscCreatedAtAsc(
            Long userId, Long bookId);

    // ── Embedding writes ─────────────────────────────────────────────────────
    //
    // The embedding column is pgvector(768). We pass it as a literal text like
    // "[0.1,0.2,...]" and cast it on the SQL side. Spring Data binds this as a
    // regular ?-parameter; pgvector accepts the textual form transparently.

    @Modifying
    @Query(value = """
            UPDATE highlights
               SET embedding = CAST(:embedding AS vector)
             WHERE id = :id
            """, nativeQuery = true)
    int updateEmbedding(@Param("id") Long id, @Param("embedding") String embedding);

    // ── Async pickup ─────────────────────────────────────────────────────────
    //
    // Used by the scheduled retry to find highlights whose embedding hasn't
    // been computed yet (either it was never tried, or the call to Gemini
    // failed). Caps the batch size to avoid bursts.

    @Query(value = """
            SELECT id FROM highlights
             WHERE embedding IS NULL
             ORDER BY id
             LIMIT :limit
            """, nativeQuery = true)
    List<Long> findIdsNeedingEmbedding(@Param("limit") int limit);

    // ── Semantic search ──────────────────────────────────────────────────────
    //
    // Cosine distance (lower = closer). We select the distance into a second
    // column so the service can expose it as a relevance score. The HNSW
    // index defined in V10 backs the ORDER BY for sub-millisecond ranking.

    @Query(value = """
            SELECT h.id, (h.embedding <=> CAST(:embedding AS vector)) AS distance
              FROM highlights h
             WHERE h.user_id = :userId
               AND h.embedding IS NOT NULL
             ORDER BY h.embedding <=> CAST(:embedding AS vector)
             LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> searchByEmbedding(
            @Param("userId") Long userId,
            @Param("embedding") String embedding,
            @Param("limit") int limit);
}
