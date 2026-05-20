package com.miguelsalamanca.nousbooks.client;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Thin wrapper around Google's Gemini embedding API.
 *
 * <p>The free tier (no billing required) is more than enough for personal
 * usage. When the API key isn't configured the client returns empty results
 * and logs a warning, so the app keeps working with semantic search simply
 * disabled — highlights themselves still save fine.
 *
 * <p>API reference:
 * https://ai.google.dev/gemini-api/docs/embeddings
 */
@Component
public class GeminiEmbeddingClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiEmbeddingClient.class);
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    // gemini-embedding-001 replaces text-embedding-004 as the current
    // recommended embedding model. We pin outputDimensionality to 768 so
    // the vectors keep matching the vector(768) column defined in V10.
    private static final String MODEL = "models/gemini-embedding-001";
    private static final int OUTPUT_DIMENSIONS = 768;

    private final RestClient restClient;
    private final String apiKey;

    public GeminiEmbeddingClient(@Value("${app.gemini.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .build();
    }

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey);
    }

    /**
     * Generate a 768-dimensional embedding for the given text. Returns
     * Optional.empty() when the API key isn't set or the call fails — callers
     * decide whether to retry or to skip the row.
     */
    public Optional<float[]> embed(String text) {
        if (!isConfigured()) {
            log.debug("Gemini API key not configured; skipping embedding");
            return Optional.empty();
        }
        if (!StringUtils.hasText(text)) {
            return Optional.empty();
        }

        try {
            EmbedRequest body = new EmbedRequest(
                    MODEL,
                    new Content(List.of(new Part(text))),
                    OUTPUT_DIMENSIONS
            );

            EmbedResponse response = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/" + MODEL + ":embedContent")
                            .queryParam("key", apiKey)
                            .build())
                    .body(body)
                    .retrieve()
                    .body(EmbedResponse.class);

            if (response == null || response.embedding() == null
                    || response.embedding().values() == null) {
                log.warn("Gemini returned an empty embedding response");
                return Optional.empty();
            }

            List<Double> values = response.embedding().values();
            float[] floats = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                floats[i] = values.get(i).floatValue();
            }
            return Optional.of(floats);

        } catch (RestClientException e) {
            // Most likely: quota hit, transient 5xx, network. Don't surface
            // as a 500 to the user — embeddings happen out-of-band.
            log.warn("Gemini embedding call failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    // ── Wire types ───────────────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EmbedRequest(String model, Content content, int outputDimensionality) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Content(List<Part> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Part(String text) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EmbedResponse(Embedding embedding) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Embedding(List<Double> values) {}
}
