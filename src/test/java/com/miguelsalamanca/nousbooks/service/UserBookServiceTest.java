package com.miguelsalamanca.nousbooks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserBookRequest;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;
import com.miguelsalamanca.nousbooks.support.TestData;

@ExtendWith(MockitoExtension.class)
class UserBookServiceTest {

    @Mock private BookService bookService;
    @Mock private UserBookRepository userBookRepository;
    @InjectMocks private UserBookService userBookService;

    private User user;
    private Book book;

    @BeforeEach
    void setUp() {
        user = TestData.user(1L, "alice@example.com");
        book = TestData.book(10L, "g1", "Book A");
    }

    // ── createUserBook ───────────────────────────────────────────────────────

    @Test
    void createUserBook_persistsAndStampsStartedAtForReading() {
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");
        req.setStatus(ReadingStatus.READING);

        when(bookService.findOrCreateByGoogleBooksId("g1")).thenReturn(book);
        when(userBookRepository.existsByUserIdAndBookId(1L, 10L)).thenReturn(false);
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UserBook ub = userBookService.createUserBook(req, user);

        assertThat(ub.getUser()).isSameAs(user);
        assertThat(ub.getBook()).isSameAs(book);
        assertThat(ub.getStatus()).isEqualTo(ReadingStatus.READING);
        assertThat(ub.getStartedAt()).isNotNull();
        assertThat(ub.getFinishedAt()).isNull();
    }

    @Test
    void createUserBook_stampsBothStartedAndFinishedForReadStatus() {
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");
        req.setStatus(ReadingStatus.READ);

        when(bookService.findOrCreateByGoogleBooksId("g1")).thenReturn(book);
        when(userBookRepository.existsByUserIdAndBookId(1L, 10L)).thenReturn(false);
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UserBook ub = userBookService.createUserBook(req, user);

        assertThat(ub.getStartedAt()).isNotNull();
        assertThat(ub.getFinishedAt()).isNotNull();
    }

    @Test
    void createUserBook_doesNotStampForToReadStatus() {
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");
        req.setStatus(ReadingStatus.TO_READ);

        when(bookService.findOrCreateByGoogleBooksId("g1")).thenReturn(book);
        when(userBookRepository.existsByUserIdAndBookId(1L, 10L)).thenReturn(false);
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UserBook ub = userBookService.createUserBook(req, user);

        assertThat(ub.getStartedAt()).isNull();
        assertThat(ub.getFinishedAt()).isNull();
    }

    @Test
    void createUserBook_preservesUserSuppliedTimestamps() {
        LocalDateTime started = LocalDateTime.of(2024, 1, 1, 10, 0);
        LocalDateTime finished = LocalDateTime.of(2024, 1, 5, 10, 0);
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");
        req.setStatus(ReadingStatus.READ);
        req.setStartedAt(started);
        req.setFinishedAt(finished);

        when(bookService.findOrCreateByGoogleBooksId("g1")).thenReturn(book);
        when(userBookRepository.existsByUserIdAndBookId(1L, 10L)).thenReturn(false);
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UserBook ub = userBookService.createUserBook(req, user);

        assertThat(ub.getStartedAt()).isEqualTo(started);
        assertThat(ub.getFinishedAt()).isEqualTo(finished);
    }

    @Test
    void createUserBook_throws409WhenAlreadyInLibrary() {
        CreateUserBookRequest req = new CreateUserBookRequest();
        req.setGoogleBooksId("g1");

        when(bookService.findOrCreateByGoogleBooksId("g1")).thenReturn(book);
        when(userBookRepository.existsByUserIdAndBookId(1L, 10L)).thenReturn(true);

        assertThatThrownBy(() -> userBookService.createUserBook(req, user))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already in your library");
        verify(userBookRepository, never()).save(any());
    }

    // ── getMyBooks ──────────────────────────────────────────────────────────

    @Test
    void getMyBooks_returnsRepositoryResults() {
        List<UserBook> list = List.of(TestData.userBook(1L, user, book, ReadingStatus.READING));
        when(userBookRepository.findByUserId(1L)).thenReturn(list);

        assertThat(userBookService.getMyBooks(user)).isSameAs(list);
    }

    // ── updateUserBook ──────────────────────────────────────────────────────

    @Test
    void updateUserBook_throws404WhenNotOwnedByUser() {
        UpdateUserBookRequest req = new UpdateUserBookRequest();
        when(userBookRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userBookService.updateUserBook(99L, req, user))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void updateUserBook_patchesProvidedFieldsOnly() {
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.TO_READ);
        existing.setRating(3);
        existing.setReview("old");
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setReview("new review");

        UserBook result = userBookService.updateUserBook(5L, req, user);

        assertThat(result.getReview()).isEqualTo("new review");
        assertThat(result.getRating()).isEqualTo(3);
        assertThat(result.getStatus()).isEqualTo(ReadingStatus.TO_READ);
    }

    @Test
    void updateUserBook_stampsStartedAtWhenTransitioningToReading() {
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.TO_READ);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setStatus(ReadingStatus.READING);

        UserBook result = userBookService.updateUserBook(5L, req, user);

        assertThat(result.getStartedAt()).isNotNull();
        assertThat(result.getFinishedAt()).isNull();
    }

    @Test
    void updateUserBook_doesNotOverwriteExistingStartedAt() {
        LocalDateTime original = LocalDateTime.of(2023, 6, 1, 0, 0);
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.READING);
        existing.setStartedAt(original);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setStatus(ReadingStatus.READ);

        UserBook result = userBookService.updateUserBook(5L, req, user);

        assertThat(result.getStartedAt()).isEqualTo(original);
        assertThat(result.getFinishedAt()).isNotNull();
    }

    @Test
    void updateUserBook_clampsCurrentPageToPageCount() {
        book.setPageCount(300);
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.READING);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setCurrentPage(9999);

        UserBook result = userBookService.updateUserBook(5L, req, user);

        assertThat(result.getCurrentPage()).isEqualTo(300);
        // Reached the final page → promote to READ
        assertThat(result.getStatus()).isEqualTo(ReadingStatus.READ);
        assertThat(result.getFinishedAt()).isNotNull();
    }

    @Test
    void updateUserBook_promotesToReadingWhenPagingFromZero() {
        book.setPageCount(300);
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.TO_READ);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setCurrentPage(42);

        UserBook result = userBookService.updateUserBook(5L, req, user);

        assertThat(result.getCurrentPage()).isEqualTo(42);
        assertThat(result.getStatus()).isEqualTo(ReadingStatus.READING);
        assertThat(result.getStartedAt()).isNotNull();
    }

    @Test
    void updateUserBook_writesPageCountThroughToBookWhenMissing() {
        book.setPageCount(null);
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.READING);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setPageCount(420);

        userBookService.updateUserBook(5L, req, user);

        assertThat(book.getPageCount()).isEqualTo(420);
    }

    @Test
    void updateUserBook_doesNotOverridePageCountAlreadyKnown() {
        book.setPageCount(300);
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.READING);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(userBookRepository.save(any(UserBook.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserBookRequest req = new UpdateUserBookRequest();
        req.setPageCount(999);

        userBookService.updateUserBook(5L, req, user);

        assertThat(book.getPageCount()).isEqualTo(300);
    }

    // ── deleteUserBook ──────────────────────────────────────────────────────

    @Test
    void deleteUserBook_deletesWhenOwned() {
        UserBook existing = TestData.userBook(5L, user, book, ReadingStatus.READING);
        when(userBookRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));

        userBookService.deleteUserBook(5L, user);

        ArgumentCaptor<UserBook> captor = ArgumentCaptor.forClass(UserBook.class);
        verify(userBookRepository).delete(captor.capture());
        assertThat(captor.getValue()).isSameAs(existing);
    }

    @Test
    void deleteUserBook_throws404WhenNotOwned() {
        when(userBookRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userBookService.deleteUserBook(7L, user))
                .isInstanceOf(ResponseStatusException.class);
        verify(userBookRepository, never()).delete(any());
    }
}
