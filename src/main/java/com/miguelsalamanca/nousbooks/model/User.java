package com.miguelsalamanca.nousbooks.model;

import java.time.LocalDateTime;

import jakarta.persistence.Id;

public class User {
    @Id
    public Long id;
    public String email;
    public String password;
    public LocalDateTime createdAt;
}
