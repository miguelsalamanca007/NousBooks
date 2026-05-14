package com.miguelsalamanca.nousbooks.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.miguelsalamanca.nousbooks.dto.BookDto;
import com.miguelsalamanca.nousbooks.dto.CreateBookRequest;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.support.TestData;

class BookMapperTest {

    private final BookMapper mapper = new BookMapper();

    @Test
    void toEntity_copiesCreateRequestFields() {
        CreateBookRequest req = new CreateBookRequest();
        req.setGoogleBooksId("g1");
        req.setTitle("Title");
        req.setDescription("desc");
        req.setThumbnail("thumb");

        Book book = mapper.toEntity(req);

        assertThat(book.getGoogleBooksId()).isEqualTo("g1");
        assertThat(book.getTitle()).isEqualTo("Title");
        assertThat(book.getDescription()).isEqualTo("desc");
        assertThat(book.getThumbnail()).isEqualTo("thumb");
    }

    @Test
    void toDto_copiesAllEntityFields() {
        Book book = TestData.book(7L, "g7", "Title");

        BookDto dto = mapper.toDto(book);

        assertThat(dto.getId()).isEqualTo(7L);
        assertThat(dto.getGoogleBooksId()).isEqualTo("g7");
        assertThat(dto.getTitle()).isEqualTo("Title");
        assertThat(dto.getDescription()).isEqualTo("desc");
        assertThat(dto.getThumbnail()).isEqualTo("http://img/g7");
        assertThat(dto.getPublishedDate()).isEqualTo("2020-01-01");
        assertThat(dto.getPageCount()).isEqualTo(300);
    }
}
