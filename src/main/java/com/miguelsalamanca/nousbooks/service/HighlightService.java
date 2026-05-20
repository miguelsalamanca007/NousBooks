package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

        if (request.getText() != null) highlight.setText(request.getText());
        if (request.getNote() != null) highlight.setNote(request.getNote());
        if (request.getPageNumber() != null) highlight.setPageNumber(request.getPageNumber());

        return highlightRepository.save(highlight);
    }

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
