package com.miguelsalamanca.nousbooks.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.BookDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.mapper.BookMapper;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.service.BookService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final BookMapper bookMapper;

    @PostMapping
    public BookDto create(@RequestBody CreateBookRequest request) {
        Book saved = bookService.createBook(request);
        return bookMapper.toDto(saved);
    }
    
    @GetMapping
    public List<BookDto> getAll() {
        return bookService.getAllBooks()
        .stream()
        .map(bookMapper::toDto)
        .toList();
    }

    @GetMapping("/{id}")
    public BookDto getBookById(@PathVariable Long id) {
        Book book = bookService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        return bookMapper.toDto(book);
    }
    
}
