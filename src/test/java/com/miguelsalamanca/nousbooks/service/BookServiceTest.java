package com.miguelsalamanca.nousbooks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.client.GoogleBooksClient;
import com.miguelsalamanca.nousbooks.dto.BookSearchRequest;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.mapper.BookMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.repository.BookRepository;
import com.miguelsalamanca.nousbooks.support.TestData;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock private BookRepository bookRepository;
    @Mock private BookMapper bookMapper;
    @Mock private GoogleBooksClient googleBooksClient;
    @InjectMocks private BookService bookService;

    @Test
    void createBook_mapsAndSaves() {
        CreateBookRequest req = new CreateBookRequest();
        Book book = TestData.book(null, "g1", "T");
        when(bookMapper.toEntity(req)).thenReturn(book);
        when(bookRepository.save(book)).thenReturn(book);

        assertThat(bookService.createBook(req)).isSameAs(book);
    }

    @Test
    void getAllBooks_delegatesToRepository() {
        List<Book> all = List.of(TestData.book(1L, "g1", "A"), TestData.book(2L, "g2", "B"));
        when(bookRepository.findAll()).thenReturn(all);

        assertThat(bookService.getAllBooks()).hasSize(2).containsExactlyElementsOf(all);
    }

    @Test
    void findById_returnsOptionalFromRepository() {
        Book b = TestData.book(1L, "g1", "T");
        when(bookRepository.findById(1L)).thenReturn(Optional.of(b));

        assertThat(bookService.findById(1L)).contains(b);
    }

    @Test
    void search_delegatesToGoogleBooksClient() {
        BookSearchRequest req = BookSearchRequest.builder().query("hobbit").build();
        BookSearchResultDto dto = new BookSearchResultDto();
        when(googleBooksClient.search(req)).thenReturn(List.of(dto));

        assertThat(bookService.search(req)).containsExactly(dto);
    }

    @Test
    void findOrCreateByGoogleBooksId_returnsExistingWithoutHittingApi() {
        Book existing = TestData.book(7L, "abc", "Existing");
        when(bookRepository.findByGoogleBooksId("abc")).thenReturn(Optional.of(existing));

        Book result = bookService.findOrCreateByGoogleBooksId("abc");

        assertThat(result).isSameAs(existing);
        verify(googleBooksClient, never()).fetchById(any());
        verify(bookRepository, never()).save(any());
    }

    @Test
    void findOrCreateByGoogleBooksId_fetchesAndPersistsWhenMissing() {
        when(bookRepository.findByGoogleBooksId("new")).thenReturn(Optional.empty());

        BookSearchResultDto volume = new BookSearchResultDto();
        volume.setGoogleBooksId("new");
        volume.setTitle("New Book");
        volume.setDescription("desc");
        volume.setThumbnail("thumb");
        volume.setPublishedDate("2024-01-01");
        volume.setPageCount(150);
        when(googleBooksClient.fetchById("new")).thenReturn(volume);
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> {
            Book b = inv.getArgument(0);
            b.setId(42L);
            return b;
        });

        Book result = bookService.findOrCreateByGoogleBooksId("new");

        assertThat(result.getId()).isEqualTo(42L);
        ArgumentCaptor<Book> captor = ArgumentCaptor.forClass(Book.class);
        verify(bookRepository).save(captor.capture());
        Book saved = captor.getValue();
        assertThat(saved.getGoogleBooksId()).isEqualTo("new");
        assertThat(saved.getTitle()).isEqualTo("New Book");
        assertThat(saved.getDescription()).isEqualTo("desc");
        assertThat(saved.getThumbnail()).isEqualTo("thumb");
        assertThat(saved.getPublishedDate()).isEqualTo("2024-01-01");
        assertThat(saved.getPageCount()).isEqualTo(150);
    }

    @Test
    void findOrCreateByGoogleBooksId_throws404WhenApiReturnsNull() {
        when(bookRepository.findByGoogleBooksId("nope")).thenReturn(Optional.empty());
        when(googleBooksClient.fetchById("nope")).thenReturn(null);

        assertThatThrownBy(() -> bookService.findOrCreateByGoogleBooksId("nope"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Book not found in Google Books");
        verify(bookRepository, never()).save(any());
    }
}
