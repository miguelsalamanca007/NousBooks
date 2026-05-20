package com.miguelsalamanca.nousbooks.mapper;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

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
        dto.setPageCount(book.getPageCount());
        dto.setAuthors(parseAuthors(book.getAuthors()));
        dto.setPublisher(book.getPublisher());

        return dto;
    }

    private List<String> parseAuthors(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        return Arrays.stream(raw.split(";"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
