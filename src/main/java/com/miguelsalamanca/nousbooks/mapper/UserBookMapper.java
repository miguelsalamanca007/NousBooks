package com.miguelsalamanca.nousbooks.mapper;

import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.model.UserBook;

public class UserBookMapper {
    public static UserBookDto toDto(UserBook userBook) {
        
        UserBookDto dto = new UserBookDto();
        dto.setBookTitle(userBook.getBook().getTitle());
        dto.setRating(userBook.getRating());
        dto.setStatus(userBook.getStatus().name());

        return dto;
    }
}


