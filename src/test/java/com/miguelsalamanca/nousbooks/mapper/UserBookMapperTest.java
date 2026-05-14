package com.miguelsalamanca.nousbooks.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.support.TestData;

class UserBookMapperTest {

    private final UserBookMapper mapper = new UserBookMapper(new BookMapper());

    @Test
    void toDto_copiesScalarsAndDelegatesBook() {
        UserBook ub = TestData.userBook(
                5L,
                TestData.user(1L, "a@b.com"),
                TestData.book(10L, "g1", "Book A"),
                ReadingStatus.READING);
        ub.setRating(4);
        ub.setReview("nice");
        ub.setCurrentPage(120);

        UserBookDto dto = mapper.toDto(ub);

        assertThat(dto.getId()).isEqualTo(5L);
        assertThat(dto.getStatus()).isEqualTo("READING");
        assertThat(dto.getRating()).isEqualTo(4);
        assertThat(dto.getReview()).isEqualTo("nice");
        assertThat(dto.getCurrentPage()).isEqualTo(120);
        assertThat(dto.getBook()).isNotNull();
        assertThat(dto.getBook().getId()).isEqualTo(10L);
        assertThat(dto.getBook().getTitle()).isEqualTo("Book A");
    }

    @Test
    void toDto_handlesNullStatusAndBook() {
        UserBook ub = new UserBook();
        ub.setId(1L);

        UserBookDto dto = mapper.toDto(ub);

        assertThat(dto.getStatus()).isNull();
        assertThat(dto.getBook()).isNull();
    }
}
