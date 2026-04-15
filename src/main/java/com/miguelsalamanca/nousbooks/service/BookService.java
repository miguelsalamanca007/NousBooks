package com.miguelsalamanca.nousbooks.service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.client.GoogleBooksClient;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.mapper.BookMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.repository.BookRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;
    private final GoogleBooksClient googleBooksClient;

    public Book createBook(CreateBookRequest request) {
        Book book = bookMapper.toEntity(request);
        return bookRepository.save(book);
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> findById(Long id) {
        return bookRepository.findById(id);
    }

    public List<BookSearchResultDto> search(String query) {
        return googleBooksClient.search(query);
    }

    /**
     * Returns the local Book for the given Google Books ID, fetching and
     * persisting it from the Google Books API if it hasn't been saved yet.
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
                    return bookRepository.save(book);
                });
    }
}
