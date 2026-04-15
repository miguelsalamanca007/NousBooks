package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserBookService {

    private final BookService bookService;
    private final UserBookRepository userBookRepository;

    public UserBook createUserBook(CreateUserBookRequest request, User currentUser) {
        Book book = bookService.findOrCreateByGoogleBooksId(request.getGoogleBooksId());

        UserBook userBook = new UserBook();
        userBook.setUser(currentUser);
        userBook.setBook(book);
        userBook.setRating(request.getRating());
        userBook.setReview(request.getReview());
        userBook.setStatus(request.getStatus());
        userBook.setStartedAt(request.getStartedAt());
        userBook.setFinishedAt(request.getFinishedAt());

        return userBookRepository.save(userBook);
    }

    public List<UserBook> getMyBooks(User currentUser) {
        return userBookRepository.findByUserId(currentUser.getId());
    }
}
