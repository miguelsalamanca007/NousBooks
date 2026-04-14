package com.miguelsalamanca.nousbooks.mapper;

import org.springframework.stereotype.Component;

import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.model.UserBook;

@Component
public class UserBookMapper {

    public UserBookDto toDto(UserBook userBook) {
        UserBookDto dto = new UserBookDto();
        dto.setBookTitle(userBook.getBook() != null ? userBook.getBook().getTitle() : null);
        dto.setRating(userBook.getRating());
        dto.setStatus(userBook.getStatus() != null ? userBook.getStatus().name() : null);
        return dto;
    }
}


