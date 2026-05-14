package com.miguelsalamanca.nousbooks.support;

import java.time.LocalDateTime;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.enums.Role;
import com.miguelsalamanca.nousbooks.model.Book;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.model.UserBook;

/** Factories for the domain entities used across the test suite. */
public final class TestData {

    private TestData() {}

    public static User user(Long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setPassword("$2a$10$hashedhashedhashedhashedhashedhashedhashedhashedhashe");
        u.setRole(Role.USER);
        u.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));
        return u;
    }

    public static User adminUser(Long id, String email) {
        User u = user(id, email);
        u.setRole(Role.ADMIN);
        return u;
    }

    public static Book book(Long id, String googleBooksId, String title) {
        Book b = new Book();
        b.setId(id);
        b.setGoogleBooksId(googleBooksId);
        b.setTitle(title);
        b.setDescription("desc");
        b.setThumbnail("http://img/" + googleBooksId);
        b.setPublishedDate("2020-01-01");
        b.setPageCount(300);
        return b;
    }

    public static UserBook userBook(Long id, User user, Book book, ReadingStatus status) {
        UserBook ub = new UserBook();
        ub.setId(id);
        ub.setUser(user);
        ub.setBook(book);
        ub.setStatus(status);
        return ub;
    }

    public static Note note(Long id, User user, Book book, String title, String content) {
        Note n = new Note();
        n.setId(id);
        n.setUser(user);
        n.setBook(book);
        n.setTitle(title);
        n.setContent(content);
        n.setCreatedAt(LocalDateTime.of(2025, 5, 1, 12, 0));
        return n;
    }
}
