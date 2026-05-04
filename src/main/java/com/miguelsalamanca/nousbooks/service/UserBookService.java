package com.miguelsalamanca.nousbooks.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserBookRequest;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserBookService {

    private final BookService bookService;
    private final UserBookRepository userBookRepository;

    public UserBook createUserBook(CreateUserBookRequest request, User currentUser) {
        Book book = bookService.findOrCreateByGoogleBooksId(request.getGoogleBooksId());

        // Avoid relying on the DB unique constraint (which would surface as a
        // 500 DataIntegrityViolationException). Translate to a clean 409.
        if (userBookRepository.existsByUserIdAndBookId(currentUser.getId(), book.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Book already in your library");
        }

        UserBook userBook = new UserBook();
        userBook.setUser(currentUser);
        userBook.setBook(book);
        userBook.setRating(request.getRating());
        userBook.setReview(request.getReview());
        userBook.setStatus(request.getStatus());
        userBook.setStartedAt(request.getStartedAt());
        userBook.setFinishedAt(request.getFinishedAt());

        // If the user adds a book directly into READING/READ (e.g. a book
        // they're already in the middle of) make sure the timeline columns
        // reflect that, even if the client didn't provide them. The stats
        // page depends on these timestamps.
        applyStatusTransitionTimestamps(userBook, null, request.getStatus());

        return userBookRepository.save(userBook);
    }

    @Transactional(readOnly = true)
    public List<UserBook> getMyBooks(User currentUser) {
        return userBookRepository.findByUserId(currentUser.getId());
    }

    public UserBook updateUserBook(Long id, UpdateUserBookRequest request, User currentUser) {
        UserBook userBook = userBookRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));

        ReadingStatus previousStatus = userBook.getStatus();

        if (request.getStatus() != null) userBook.setStatus(request.getStatus());
        if (request.getRating() != null) userBook.setRating(request.getRating());
        if (request.getReview() != null) userBook.setReview(request.getReview());
        if (request.getStartedAt() != null) userBook.setStartedAt(request.getStartedAt());
        if (request.getFinishedAt() != null) userBook.setFinishedAt(request.getFinishedAt());

        if (request.getStatus() != null) {
            applyStatusTransitionTimestamps(userBook, previousStatus, request.getStatus());
        }

        return userBookRepository.save(userBook);
    }

    public void deleteUserBook(Long id, User currentUser) {
        UserBook userBook = userBookRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        userBookRepository.delete(userBook);
    }

    /**
     * Stamp started_at / finished_at when a book transitions into READING or
     * READ for the first time. We never overwrite a value the user (or a
     * previous transition) already set — the timestamps mark the *first*
     * time each milestone was reached, so the per-month chart counts each
     * book once.
     */
    private void applyStatusTransitionTimestamps(UserBook userBook,
                                                 ReadingStatus previous,
                                                 ReadingStatus next) {
        if (next == null || next == previous) return;
        LocalDateTime now = LocalDateTime.now();
        if (next == ReadingStatus.READING && userBook.getStartedAt() == null) {
            userBook.setStartedAt(now);
        }
        if (next == ReadingStatus.READ) {
            // A book moved straight from TO_READ to READ still counts as
            // started — otherwise the time-on-shelf is undefined.
            if (userBook.getStartedAt() == null) userBook.setStartedAt(now);
            if (userBook.getFinishedAt() == null) userBook.setFinishedAt(now);
        }
    }
}
