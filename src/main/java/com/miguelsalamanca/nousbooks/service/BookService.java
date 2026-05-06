package com.miguelsalamanca.nousbooks.service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.client.GoogleBooksClient;
import com.miguelsalamanca.nousbooks.dto.BookSearchRequest;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.mapper.BookMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.repository.BookRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;
    private final GoogleBooksClient googleBooksClient;

    public Book createBook(CreateBookRequest request) {
        Book book = bookMapper.toEntity(request);
        return bookRepository.save(book);
    }

    @Transactional(readOnly = true)
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Book> findById(Long id) {
        return bookRepository.findById(id);
    }

    /** Search hits Google Books only — no DB I/O, so no transaction needed. */
    public List<BookSearchResultDto> search(BookSearchRequest request) {
        return googleBooksClient.search(request);
    }

    /**
     * Returns the local Book for the given Google Books ID, fetching and
     * persisting it from the Google Books API if it hasn't been saved yet.
     *
     * Wrapped in a transaction so the lookup + insert + (downstream) UserBook
     * insert all commit or roll back together. Two concurrent callers can
     * still race past the existence check — if the second insert violates the
     * unique constraint we surface a 409, retry-friendly for the client.
     */
    public Book findOrCreateByGoogleBooksId(String googleBooksId) {
        return bookRepository.findByGoogleBooksId(googleBooksId)
                .orElseGet(() -> {
                    BookSearchResultDto volume = googleBooksClient.fetchById(googleBooksId);
                    if (volume == null) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Book not found in Google Books: " + googleBooksId);
                    }
                    Book book = new Book();
                    book.setGoogleBooksId(volume.getGoogleBooksId());
                    book.setTitle(volume.getTitle());
                    book.setDescription(volume.getDescription());
                    book.setThumbnail(volume.getThumbnail());
                    book.setPublishedDate(volume.getPublishedDate());
                    book.setPageCount(volume.getPageCount());
                    return bookRepository.save(book);
                });
    }
}
