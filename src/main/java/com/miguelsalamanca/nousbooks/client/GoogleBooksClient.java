package com.miguelsalamanca.nousbooks.client;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.miguelsalamanca.nousbooks.dto.BookSearchRequest;
import com.miguelsalamanca.nousbooks.dto.BookSearchResultDto;
import com.miguelsalamanca.nousbooks.enums.PrintType;

@Component
public class GoogleBooksClient {

    private static final Logger log = LoggerFactory.getLogger(GoogleBooksClient.class);
    private static final String BASE_URL = "https://www.googleapis.com/books/v1";
    private static final int DEFAULT_MAX_RESULTS = 40;

    private final RestClient restClient;
    private final String apiKey;

    public GoogleBooksClient(@Value("${app.google-books.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .build();
    }

    public List<BookSearchResultDto> search(BookSearchRequest request) {
        String q = buildQuery(request);
        if (!StringUtils.hasText(q)) {
            return Collections.emptyList();
        }

        int maxResults = request.size() != null ? request.size() : DEFAULT_MAX_RESULTS;
        int startIndex = request.page() != null ? request.page() * maxResults : 0;

        PrintType printType = request.printType() != null ? request.printType() : PrintType.BOOKS;

        UriComponentsBuilder builder = UriComponentsBuilder.fromPath("/volumes")
                .queryParam("q", q)
                .queryParam("printType", printType.getValue())
                .queryParam("maxResults", maxResults)
                .queryParam("startIndex", startIndex);

        if (request.orderBy() != null) {
            builder.queryParam("orderBy", request.orderBy().getValue());
        }

        builder.queryParamIfPresent("key", apiKeyAsOptional());

        String uri = builder.build().toUriString();

        try {
            SearchResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(SearchResponse.class);

            if (response == null || response.items() == null) {
                return Collections.emptyList();
            }
            Set<String> seen = new LinkedHashSet<>();
            return response.items().stream()
                    .filter(item -> seen.add(item.id()))
                    .map(this::toDto)
                    .toList();

        } catch (RestClientException e) {
            log.warn("Google Books search failed for query '{}': {}", q, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Book search is temporarily unavailable. Please try again later.");
        }
    }

    public BookSearchResultDto fetchById(String googleBooksId) {
        String uri = UriComponentsBuilder.fromPath("/volumes")
                .pathSegment(googleBooksId)
                .queryParamIfPresent("key", apiKeyAsOptional())
                .build()
                .toUriString();

        try {
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

    /**
     * Builds the Google Books query string from a request, combining free text
     * with optional field qualifiers (inauthor:, inpublisher:, subject:).
     * Only non-blank fields are included; tokens are joined by a single space.
     */
    private String buildQuery(BookSearchRequest request) {
        List<String> parts = new ArrayList<>();

        if (StringUtils.hasText(request.query())) {
            parts.add(request.query().trim());
        }
        if (StringUtils.hasText(request.author())) {
            parts.add("inauthor:" + request.author().trim());
        }
        if (StringUtils.hasText(request.publisher())) {
            parts.add("inpublisher:" + request.publisher().trim());
        }
        if (StringUtils.hasText(request.subject())) {
            parts.add("subject:" + request.subject().trim());
        }

        return String.join(" ", parts);
    }

    private Optional<String> apiKeyAsOptional() {
        return StringUtils.hasText(apiKey) ? Optional.of(apiKey) : Optional.empty();
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
            dto.setPageCount(info.pageCount());
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
            Integer pageCount,
            ImageLinks imageLinks
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ImageLinks(String thumbnail) {}
}
