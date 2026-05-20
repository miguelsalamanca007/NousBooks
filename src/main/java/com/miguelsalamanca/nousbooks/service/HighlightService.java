package com.miguelsalamanca.nousbooks.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.client.GeminiEmbeddingClient;
import com.miguelsalamanca.nousbooks.dto.CreateHighlightRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateHighlightRequest;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Highlight;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.BookRepository;
import com.miguelsalamanca.nousbooks.repository.HighlightRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class HighlightService {

    private final HighlightRepository highlightRepository;
    private final BookRepository bookRepository;
    private final HighlightEmbeddingService embeddingService;
    private final GeminiEmbeddingClient geminiClient;

    public Highlight create(CreateHighlightRequest request, User currentUser) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Book not found"));

        Highlight highlight = new Highlight();
        highlight.setUser(currentUser);
        highlight.setBook(book);
        highlight.setText(request.getText());
        highlight.setNote(request.getNote());
        highlight.setPageNumber(request.getPageNumber());

        Highlight saved = highlightRepository.save(highlight);
        log.info("Created highlight id={} for user id={} book id={}",
                saved.getId(), currentUser.getId(), book.getId());

        // Fire-and-forget: the highlight is usable immediately; semantic
        // search starts working once Gemini returns (typically <1s).
        embeddingService.embedAsync(saved.getId());

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Highlight> listMine(User currentUser) {
        return highlightRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<Highlight> listByBook(Long bookId, User currentUser) {
        return highlightRepository
                .findByUserIdAndBookIdOrderByPageNumberAscCreatedAtAsc(
                        currentUser.getId(), bookId);
    }

    public Highlight update(Long id, UpdateHighlightRequest request, User currentUser) {
        Highlight highlight = loadOwned(id, currentUser);

        boolean textChanged = false;
        if (request.getText() != null && !request.getText().equals(highlight.getText())) {
            highlight.setText(request.getText());
            textChanged = true;
        }
        if (request.getNote() != null && !request.getNote().equals(highlight.getNote())) {
            highlight.setNote(request.getNote());
            textChanged = true;
        }
        if (request.getPageNumber() != null) highlight.setPageNumber(request.getPageNumber());

        Highlight saved = highlightRepository.save(highlight);

        // Only re-embed when the searchable content actually changed —
        // page-number edits don't need a new vector.
        if (textChanged) {
            highlightRepository.updateEmbedding(saved.getId(), null);
            embeddingService.embedAsync(saved.getId());
        }
        return saved;
    }

    // ── Semantic search ──────────────────────────────────────────────────────
    //
    // Embed the user's query, then ask Postgres for the nearest neighbours
    // among this user's highlights. The relevance score returned to the
    // caller is raw cosine distance (smaller = more relevant) so the
    // frontend can display it directly or convert to a percentage.

    @Transactional(readOnly = true)
    public List<HighlightWithScore> search(String query, int limit, User currentUser) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        Optional<float[]> queryVector = geminiClient.embed(query);
        if (queryVector.isEmpty()) {
            // Either Gemini isn't configured or the call failed. Fall back to
            // an empty result rather than 500ing — the UI shows "no results".
            log.debug("Search skipped: embedding unavailable for query");
            return List.of();
        }

        String literal = HighlightEmbeddingService.toPgVectorLiteral(queryVector.get());
        List<Object[]> rows = highlightRepository.searchByEmbedding(
                currentUser.getId(), literal, Math.min(limit, 50));
        if (rows.isEmpty()) {
            return List.of();
        }

        // Two-step lookup keeps the native query small (just id + distance)
        // and lets JPA hydrate the entities (with book) in a single batch.
        List<Long> ids = rows.stream().map(r -> ((Number) r[0]).longValue()).toList();
        Map<Long, Double> distanceById = new HashMap<>();
        for (Object[] r : rows) {
            distanceById.put(((Number) r[0]).longValue(), ((Number) r[1]).doubleValue());
        }

        Map<Long, Highlight> hydrated = new HashMap<>();
        highlightRepository.findAllById(ids).forEach(h -> hydrated.put(h.getId(), h));

        List<HighlightWithScore> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            Highlight h = hydrated.get(id);
            if (h != null) {
                ordered.add(new HighlightWithScore(h, distanceById.get(id)));
            }
        }
        return ordered;
    }

    public record HighlightWithScore(Highlight highlight, double distance) {}

    public void delete(Long id, User currentUser) {
        Highlight highlight = loadOwned(id, currentUser);
        highlightRepository.delete(highlight);
        log.info("Deleted highlight id={} for user id={}", id, currentUser.getId());
    }

    private Highlight loadOwned(Long id, User currentUser) {
        Highlight highlight = highlightRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Highlight not found"));
        if (!highlight.getUser().getId().equals(currentUser.getId())) {
            // 404 rather than 403 to avoid leaking the existence of other
            // users' highlights to an attacker enumerating IDs.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Highlight not found");
        }
        return highlight;
    }
}
