package com.miguelsalamanca.nousbooks.client;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;

@Component
public class GoogleBooksClient {

    private static final Logger log = LoggerFactory.getLogger(GoogleBooksClient.class);
    private static final String BASE_URL = "https://www.googleapis.com/books/v1";

    private final RestClient restClient;
    private final String apiKey;

    public GoogleBooksClient(@Value("${app.google-books.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .build();
    }

    public List<BookSearchResultDto> search(String query) {
        try {
            String uri = buildUri("/volumes?q={q}&maxResults=20&printType=books", query);
            SearchResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(SearchResponse.class);

            if (response == null || response.items() == null) {
                return Collections.emptyList();
            }
            return response.items().stream().map(this::toDto).toList();

        } catch (RestClientException e) {
            log.warn("Google Books search failed for query '{}': {}", query, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Book search is temporarily unavailable. Please try again later.");
        }
    }

    public BookSearchResultDto fetchById(String googleBooksId) {
        try {
            String uri = buildUri("/volumes/" + googleBooksId, null);
            Item item = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(Item.class);

            return item != null ? toDto(item) : null;

        } catch (RestClientException e) {
            log.warn("Google Books fetchById failed for id '{}': {}", googleBooksId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not fetch book data. Please try again later.");
        }
    }

    /** Appends the API key to the URI if one is configured. */
    private String buildUri(String base, String query) {
        StringBuilder uri = new StringBuilder(base);
        if (StringUtils.hasText(apiKey)) {
            uri.append(base.contains("?") ? "&" : "?").append("key=").append(apiKey);
        }
        // Replace {q} placeholder
        if (query != null) {
            return uri.toString().replace("{q}", query);
        }
        return uri.toString();
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
