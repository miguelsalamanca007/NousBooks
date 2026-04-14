package com.miguelsalamanca.nousbooks.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

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
}
