package com.miguelsalamanca.nousbooks.config;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Tags every request with a stable identifier and emits a single access-log
 * line on completion. The request id is exposed via the X-Request-Id response
 * header so clients (and downstream logs) can correlate.
 *
 * Runs at HIGHEST_PRECEDENCE so the MDC context is in place before Spring
 * Security and any other filter logs anything.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("access");

    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String MDC_REQUEST_ID = "requestId";
    private static final String MDC_USER_ID = "userId";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain) throws ServletException, IOException {

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_REQUEST_ID, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        long start = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            // Authentication is populated by JwtAuthFilter further down the chain,
            // so we read it here (after doFilter) to log who the request belonged to.
            populateUserMdc();
            long elapsed = System.currentTimeMillis() - start;
            int status = response.getStatus();

            if (status >= 500) {
                log.error("{} {} -> {} ({} ms)", request.getMethod(), request.getRequestURI(), status, elapsed);
            } else if (status >= 400) {
                log.warn("{} {} -> {} ({} ms)", request.getMethod(), request.getRequestURI(), status, elapsed);
            } else {
                log.info("{} {} -> {} ({} ms)", request.getMethod(), request.getRequestURI(), status, elapsed);
            }
            MDC.remove(MDC_REQUEST_ID);
            MDC.remove(MDC_USER_ID);
        }
    }

    private void populateUserMdc() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            MDC.put(MDC_USER_ID, auth.getName());
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // The H2 console is a dev-only convenience and would otherwise spam
        // an access-log line per static asset.
        return path.startsWith("/h2-console");
    }
}
