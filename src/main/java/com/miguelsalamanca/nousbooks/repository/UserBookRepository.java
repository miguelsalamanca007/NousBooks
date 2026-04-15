package com.miguelsalamanca.nousbooks.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.miguelsalamanca.nousbooks.model.UserBook;

@Repository
public interface UserBookRepository extends JpaRepository<UserBook, Long> {

    List<UserBook> findByUserId(Long userId);
    List<UserBook> findByBookId(Long bookId);
    Optional<UserBook> findByIdAndUserId(Long id, Long userId);
}
