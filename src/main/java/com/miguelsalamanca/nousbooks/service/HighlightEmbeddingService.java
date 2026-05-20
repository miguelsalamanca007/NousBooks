package com.miguelsalamanca.nousbooks.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miguelsalamanca.nousbooks.client.GeminiEmbeddingClient;
import com.miguelsalamanca.nousbooks.model.Highlight;
import com.miguelsalamanca.nousbooks.repository.HighlightRepository;

import lombok.RequiredArgsConstructor;

/**
 * Generates embeddings for new and edited highlights so they show up in
 * semantic search. Runs out-of-band so the user gets an immediate response
 * when creating a highlight; the embedding fills in seconds later.
 *
 * <p>Two entry points:
 * <ul>
 *   <li>{@link #embedAsync} — called fire-and-forget from
 *       {@code HighlightService} right after a create or update.</li>
 *   <li>{@link #retryMissing} — scheduled sweep that picks up highlights
 *       whose embedding is still null (because the API key wasn't set,
 *       Gemini was down, or the @Async call lost a race).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class HighlightEmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(HighlightEmbeddingService.class);

    private static final int RETRY_BATCH_SIZE = 20;

    private final GeminiEmbeddingClient geminiClient;
    private final HighlightRepository highlightRepository;

    @Async
    @Transactional
    public void embedAsync(Long highlightId) {
        embedOne(highlightId);
    }

    /**
     * Picks up any highlights whose embedding never landed and retries them.
     * The HNSW index makes the table cheap to scan even at scale because we
     * filter by IS NULL, which doesn't use the vector index anyway.
     */
    @Scheduled(fixedDelayString = "${app.gemini.retry-delay-ms:300000}",
               initialDelayString = "${app.gemini.retry-initial-delay-ms:60000}")
    @Transactional
    public void retryMissing() {
        if (!geminiClient.isConfigured()) {
            return;
        }
        List<Long> ids = highlightRepository.findIdsNeedingEmbedding(RETRY_BATCH_SIZE);
        if (ids.isEmpty()) {
            return;
        }
        log.info("Retrying embeddings for {} highlight(s)", ids.size());
        for (Long id : ids) {
            embedOne(id);
        }
    }

    private void embedOne(Long highlightId) {
        Optional<Highlight> maybe = highlightRepository.findById(highlightId);
        if (maybe.isEmpty()) {
            return;
        }
        Highlight h = maybe.get();

        String text = buildEmbeddingInput(h);
        Optional<float[]> vector = geminiClient.embed(text);
        if (vector.isEmpty()) {
            // The scheduled retry will pick this up on its next run.
            return;
        }

        highlightRepository.updateEmbedding(highlightId, toPgVectorLiteral(vector.get()));
        log.debug("Embedded highlight id={}", highlightId);
    }

    /**
     * Combine highlight text with the user's note so a search for an idea in
     * the note also surfaces the highlight, and vice versa.
     */
    private String buildEmbeddingInput(Highlight h) {
        String note = h.getNote();
        if (note == null || note.isBlank()) {
            return h.getText();
        }
        return h.getText() + "\n\n" + note;
    }

    /**
     * pgvector accepts vectors written as "[v1,v2,...]". Building the literal
     * here keeps the repository contract simple (single string parameter)
     * and avoids pulling in a pgvector-specific Hibernate type.
     */
    static String toPgVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 10);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
