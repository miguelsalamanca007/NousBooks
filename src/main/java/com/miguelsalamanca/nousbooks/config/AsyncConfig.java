package com.miguelsalamanca.nousbooks.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables the @Async and @Scheduled hooks used by the highlight embedding
 * pipeline (HighlightEmbeddingService). Spring Boot doesn't enable these by
 * default, and we want them on without a dependency on the main app class.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
}
