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

        // Allow filling in pageCount when Google Books didn't supply it (or
        // got it wrong). We only write it back to the shared Book row, never
        // override a value the API already provided.
        Book book = userBook.getBook();
        if (request.getPageCount() != null && book.getPageCount() == null) {
            book.setPageCount(request.getPageCount());
        }

        if (request.getCurrentPage() != null) {
            Integer page = request.getCurrentPage();
            // Clamp to [0, pageCount] when we know the total — protects the UI
            // from a user who types 9999 in a 300-page book.
            Integer total = book.getPageCount();
            if (total != null && page > total) page = total;
            userBook.setCurrentPage(page);

            // Convenience: a book at page 0 hasn't really started; one at the
            // last page is finished. Promote the status accordingly so the
            // user doesn't have to do it manually.
            if (total != null && page.equals(total) && userBook.getStatus() != ReadingStatus.READ) {
                userBook.setStatus(ReadingStatus.READ);
            } else if (page > 0 && userBook.getStatus() == ReadingStatus.TO_READ) {
                userBook.setStatus(ReadingStatus.READING);
            }
        }

        // Compute timestamps off the *final* status, which may have been
        // promoted above by the progress logic.
        if (userBook.getStatus() != previousStatus) {
            applyStatusTransitionTimestamps(userBook, previousStatus, userBook.getStatus());
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
