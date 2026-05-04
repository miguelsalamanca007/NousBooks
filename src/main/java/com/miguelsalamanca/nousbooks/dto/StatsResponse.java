package com.miguelsalamanca.nousbooks.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.miguelsalamanca.nousbooks.enums.ReadingStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Aggregate reading statistics for the currently authenticated user.
 *
 * <p>This is the single payload powering the {@code /stats} page on the
 * frontend. We compute everything in one round trip so the page renders
 * with no extra network requests and no on-the-fly aggregation in the UI.
 */
@Getter
@AllArgsConstructor
public class StatsResponse {

    /** Total books in the library, regardless of status. */
    private long totalBooks;

    /** Counts keyed by reading status. Always contains every status — zero
     *  when the user has none in that bucket — so the frontend doesn't have
     *  to defensively handle missing keys. */
    private Map<ReadingStatus, Long> booksByStatus;

    /** Total notes across all books. */
    private long totalNotes;

    /** Books finished from January 1st of the current year through now. */
    private long readThisYear;

    /** Up to 12 entries (one per month) for the rolling year leading up to
     *  today. The frontend renders them as a bar chart. */
    private List<MonthlyCount> finishedByMonth;

    /** When the user account was created — used for "Member since". */
    private LocalDateTime memberSince;

    @Getter
    @AllArgsConstructor
    public static class MonthlyCount {
        /** ISO {@code YYYY-MM} so the frontend doesn't have to do timezone
         *  math when sorting or formatting. */
        private String month;
        private long count;
    }
}
