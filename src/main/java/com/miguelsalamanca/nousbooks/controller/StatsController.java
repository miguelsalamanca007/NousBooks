package com.miguelsalamanca.nousbooks.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.StatsResponse;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.service.StatsService;

import lombok.RequiredArgsConstructor;

/**
 * Read-only stats endpoint backing the frontend {@code /stats} page.
 * Everything is scoped to the authenticated user — there is no admin /
 * cross-user view here.
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/me")
    public StatsResponse getMyStats(@AuthenticationPrincipal User currentUser) {
        return statsService.getStatsFor(currentUser);
    }
}
