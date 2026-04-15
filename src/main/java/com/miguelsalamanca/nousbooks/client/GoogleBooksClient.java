package com.miguelsalamanca.nousbooks.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;

@Component
public class GoogleBooksClient {

    private static final String BASE_URL = "https://www.googleapis.com/books/v1";

    private final RestClient restClient;

    public GoogleBooksClient() {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .build();
    }

    public List<BookSearchResultDto> search(String query) {
        SearchResponse response = restClient.get()
                .uri("/volumes?q={q}&maxResults=20&printType=books", query)
                .retrieve()
                .body(SearchResponse.class);

        if (response == null || response.items() == null) {
            return Collections.emptyList();
        }

        return response.items().stream()
                .map(this::toDto)
                .toList();
    }

    public BookSearchResultDto fetchById(String googleBooksId) {
        Item item = restClient.get()
                .uri("/volumes/{id}", googleBooksId)
                .retrieve()
                .body(Item.class);

        if (item == null) {
            return null;
        }
        return toDto(item);
    }

    private BookSearchResultDto toDto(Item item) {
        BookSearchResultDto dto = new BookSearchResultDto();
        dto.setGoogleBooksId(item.id());

        VolumeInfo info = item.volumeInfo();
        if (info != null) {
            dto.setTitle(info.title());
            dto.setAuthors(info.authors() != null ? info.authors() : Collections.emptyList());
            dto.setDescription(info.description());
            dto.setPublishedDate(info.publishedDate());
            if (info.imageLinks() != null) {
                dto.setThumbnail(info.imageLinks().thumbnail());
            }
        }
        return dto;
    }

    // ── Internal response types ───────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SearchResponse(List<Item> items) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Item(String id, VolumeInfo volumeInfo) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record VolumeInfo(
            String title,
            List<String> authors,
            String description,
            String publishedDate,
            ImageLinks imageLinks
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ImageLinks(String thumbnail) {}
}
