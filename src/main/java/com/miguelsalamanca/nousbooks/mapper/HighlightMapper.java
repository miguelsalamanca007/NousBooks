package com.miguelsalamanca.nousbooks.mapper;

import org.springframework.stereotype.Component;

import com.miguelsalamanca.nousbooks.dto.HighlightDto;
import com.miguelsalamanca.nousbooks.model.Highlight;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class HighlightMapper {

    private final BookMapper bookMapper;

    public HighlightDto toDto(Highlight highlight) {
        HighlightDto dto = new HighlightDto();
        dto.setId(highlight.getId());
        dto.setBook(highlight.getBook() != null ? bookMapper.toDto(highlight.getBook()) : null);
        dto.setText(highlight.getText());
        dto.setNote(highlight.getNote());
        dto.setPageNumber(highlight.getPageNumber());
        dto.setCreatedAt(highlight.getCreatedAt());
        return dto;
    }

    public HighlightDto toDto(Highlight highlight, double distance) {
        HighlightDto dto = toDto(highlight);
        dto.setRelevance(distance);
        return dto;
    }
}
