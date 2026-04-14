package com.miguelsalamanca.nousbooks.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.miguelsalamanca.nousbooks.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
    
}
