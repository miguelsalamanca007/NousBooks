package com.miguelsalamanca.nousbooks.mapper;

import org.springframework.stereotype.Component;

import com.miguelsalamanca.nousbooks.dto.BookDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.model.Book;

@Component
public class BookMapper {
    
    public Book toEntity(CreateBookRequest request) {
        Book book = new Book();
        book.setGoogleBooksId(request.getGoogleBooksId());
        book.setTitle(request.getTitle());
        book.setDescription(request.getDescription());
        book.setThumbnail(request.getThumbnail());

        return book;
    }

    public BookDto toDto(Book book) {
        BookDto dto = new BookDto();
        dto.setId(book.getId());
        dto.setGoogleBooksId(book.getGoogleBooksId());
        dto.setTitle(book.getTitle());
        dto.setDescription(book.getDescription());
        dto.setThumbnail(book.getThumbnail());
        dto.setPublishedDate(book.getPublishedDate());

        return dto;
    }
}
