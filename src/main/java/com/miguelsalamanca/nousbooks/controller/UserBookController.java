package com.miguelsalamanca.nousbooks.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UpdateUserBookRequest;
import com.miguelsalamanca.nousbooks.dto.UserBookDto;
import com.miguelsalamanca.nousbooks.mapper.UserBookMapper;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.service.UserBookService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user-books")
@RequiredArgsConstructor
public class UserBookController {

    private final UserBookService userBookService;
    private final UserBookMapper userBookMapper;

    @PostMapping
    public UserBookDto create(@Valid @RequestBody CreateUserBookRequest request,
                              @AuthenticationPrincipal User currentUser) {
        return userBookMapper.toDto(userBookService.createUserBook(request, currentUser));
    }

    @GetMapping("/me")
    public List<UserBookDto> getMyBooks(@AuthenticationPrincipal User currentUser) {
        return userBookService.getMyBooks(currentUser)
                .stream()
                .map(userBookMapper::toDto)
                .toList();
    }

    @PatchMapping("/{id}")
    public UserBookDto update(@PathVariable Long id,
                              @Valid @RequestBody UpdateUserBookRequest request,
                              @AuthenticationPrincipal User currentUser) {
        return userBookMapper.toDto(userBookService.updateUserBook(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal User currentUser) {
        userBookService.deleteUserBook(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
