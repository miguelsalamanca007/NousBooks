package com.miguelsalamanca.nousbooks.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.mapper.UserBookMapper;
import com.miguelsalamanca.nousbooks.service.UserBookService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/user-books")
@RequiredArgsConstructor
public class UserBookController {

    private final UserBookService userBookService;
    private final UserBookMapper userBookMapper;

    @PostMapping
    public UserBookDto create(@RequestBody CreateUserBookRequest request) {
        return userBookMapper.toDto(userBookService.createUserBook(request));
    }

    @GetMapping("/user/{id}")
    public List<UserBookDto> getBooksByUserId(@PathVariable Long id) {
        return userBookService.findByUserId(id)
                .stream()
                .map(userBookMapper::toDto)
                .toList();
    }

    @GetMapping("/book/{id}")
    public List<UserBookDto> getUserByBookID(@PathVariable Long id) {
        return userBookService.findByBookId(id)
                .stream()
                .map(userBookMapper::toDto)
                .toList();
    }

}
