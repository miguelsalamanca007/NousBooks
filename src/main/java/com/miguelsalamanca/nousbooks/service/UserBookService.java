package com.miguelsalamanca.nousbooks.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.repository.BookRepository;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;
import com.miguelsalamanca.nousbooks.repository.UserRepository;

@Service
public class UserBookService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final UserBookRepository userBookRepository;

    public UserBookService(UserRepository userRepository, BookRepository bookRepository, UserBookRepository userBookRepository) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.userBookRepository = userBookRepository;
    }

    public UserBook createUserBook(CreateUserBookRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found"));

        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBook(book);
        userBook.setRating(request.getRating());
        userBook.setReview(request.getReview());
        userBook.setStatus(request.getStatus());

        return userBookRepository.save(userBook);
    }

    public List<UserBook> findByUserId(Long userId) {
        System.out.println("ID :: " + userId);
        return userBookRepository.findByUserId(userId);
    }

    public List<UserBook> findByBookId(Long bookId) {
        System.out.println("ID :: " + bookId);
        return userBookRepository.findByBookId(bookId);
    }
}
