package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.repository.BookRepository;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;
import com.miguelsalamanca.nousbooks.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserBookService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final UserBookRepository userBookRepository;

    public UserBook createUserBook(CreateUserBookRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
                

        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBook(book);
        userBook.setRating(request.getRating());
        userBook.setReview(request.getReview());
        userBook.setStatus(request.getStatus());
        userBook.setStartedAt(request.getStartedAt());
        userBook.setFinishedAt(request.getFinishedAt());

        return userBookRepository.save(userBook);
    }

    public List<UserBook> findByUserId(Long userId) {
        return userBookRepository.findByUserId(userId);
    }

    public List<UserBook> findByBookId(Long bookId) {
        return userBookRepository.findByBookId(bookId);
    }
}
