package com.miguelsalamanca.nousbooks.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.mapper.UserBookMapper;
import com.miguelsalamanca.nousbooks.model.UserBook;
import com.miguelsalamanca.nousbooks.service.UserBookService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/user-books")
public class UserBookController {

    private final UserBookService userBookService;

    public UserBookController(UserBookService userBookService) {
        this.userBookService = userBookService;
    }
    
    @PostMapping
    public UserBook create(@RequestBody CreateUserBookRequest request) {
        return userBookService.createUserBook(request);
    }

    @GetMapping("/user/{id}")
    public List<UserBookDto> getBooksByUserId(@PathVariable Long id) {
        return userBookService.findByUserId(id)
        .stream()
        .map(UserBookMapper::toDto)
        .toList();
    }
    
    @GetMapping("/book/{id}")
    public List<UserBook> getUserByBookID(@PathVariable Long id) {
        return userBookService.findByBookId(id);
    }

}
