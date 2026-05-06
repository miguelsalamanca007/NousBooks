package com.miguelsalamanca.nousbooks.mapper;

import org.springframework.stereotype.Component;

import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.model.UserBook;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UserBookMapper {

    private final BookMapper bookMapper;

    public UserBookDto toDto(UserBook userBook) {
        UserBookDto dto = new UserBookDto();
        dto.setId(userBook.getId());
        dto.setBook(userBook.getBook() != null ? bookMapper.toDto(userBook.getBook()) : null);
        dto.setStatus(userBook.getStatus() != null ? userBook.getStatus().name() : null);
        dto.setRating(userBook.getRating());
        dto.setReview(userBook.getReview());
        dto.setStartedAt(userBook.getStartedAt());
        dto.setFinishedAt(userBook.getFinishedAt());
        dto.setCurrentPage(userBook.getCurrentPage());
        return dto;
    }
}
