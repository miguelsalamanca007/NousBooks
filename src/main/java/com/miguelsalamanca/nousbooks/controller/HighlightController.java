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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.miguelsalamanca.nousbooks.dto.CreateHighlightRequest;
import com.miguelsalamanca.nousbooks.dto.HighlightDto;
import com.miguelsalamanca.nousbooks.dto.UpdateHighlightRequest;
import com.miguelsalamanca.nousbooks.mapper.HighlightMapper;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.service.HighlightService;
import com.miguelsalamanca.nousbooks.service.HighlightService.HighlightWithScore;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/highlights")
@RequiredArgsConstructor
public class HighlightController {

    private final HighlightService highlightService;
    private final HighlightMapper highlightMapper;

    @PostMapping
    public HighlightDto create(@Valid @RequestBody CreateHighlightRequest request,
                               @AuthenticationPrincipal User currentUser) {
        return highlightMapper.toDto(highlightService.create(request, currentUser));
    }

    @GetMapping
    public List<HighlightDto> getMine(@AuthenticationPrincipal User currentUser) {
        return highlightService.listMine(currentUser)
                .stream()
                .map(highlightMapper::toDto)
                .toList();
    }

    @GetMapping("/by-book/{bookId}")
    public List<HighlightDto> getByBook(@PathVariable Long bookId,
                                        @AuthenticationPrincipal User currentUser) {
        return highlightService.listByBook(bookId, currentUser)
                .stream()
                .map(highlightMapper::toDto)
                .toList();
    }

    @GetMapping("/search")
    public List<HighlightDto> search(@RequestParam("q") String query,
                                     @RequestParam(value = "limit", defaultValue = "20") int limit,
                                     @AuthenticationPrincipal User currentUser) {
        List<HighlightWithScore> results = highlightService.search(query, limit, currentUser);
        return results.stream()
                .map(r -> highlightMapper.toDto(r.highlight(), r.distance()))
                .toList();
    }

    @PatchMapping("/{id}")
    public HighlightDto update(@PathVariable Long id,
                               @Valid @RequestBody UpdateHighlightRequest request,
                               @AuthenticationPrincipal User currentUser) {
        return highlightMapper.toDto(highlightService.update(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal User currentUser) {
        highlightService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
