package com.miguelsalamanca.nousbooks.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miguelsalamanca.nousbooks.dto.StatsResponse;
import com.miguelsalamanca.nousbooks.dto.StatsResponse.MonthlyCount;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.NoteRepository;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    /** How many trailing months the per-month chart covers (including current). */
    private static final int MONTHS_WINDOW = 12;

    private final UserBookRepository userBookRepository;
    private final NoteRepository noteRepository;

    public StatsResponse getStatsFor(User user) {
        Long userId = user.getId();

        long totalBooks = userBookRepository.countByUserId(userId);
        long totalNotes = noteRepository.countByUserId(userId);

        Map<ReadingStatus, Long> booksByStatus = new EnumMap<>(ReadingStatus.class);
        for (ReadingStatus status : ReadingStatus.values()) {
            booksByStatus.put(status, userBookRepository.countByUserIdAndStatus(userId, status));
        }

        // Books finished from Jan 1st this year onward.
        LocalDateTime startOfYear = LocalDate.now().withDayOfYear(1).atStartOfDay();
        long readThisYear = countFinishedSince(userId, startOfYear);

        List<MonthlyCount> finishedByMonth = buildMonthlyCounts(userId);

        return new StatsResponse(
                totalBooks,
                booksByStatus,
                totalNotes,
                readThisYear,
                finishedByMonth,
                user.getCreatedAt()
        );
    }

    /**
     * Produces exactly {@link #MONTHS_WINDOW} entries ending on the current
     * month. Months with no finished books appear with {@code count = 0} so
     * the bar chart on the frontend renders a continuous timeline rather
     * than skipping empty months.
     */
    private List<MonthlyCount> buildMonthlyCounts(Long userId) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth firstMonth = currentMonth.minusMonths(MONTHS_WINDOW - 1L);
        LocalDateTime since = firstMonth.atDay(1).atStartOfDay();

        // Aggregate in SQL, then bucket the rows into a (year, month) -> count map.
        Map<YearMonth, Long> aggregated = new HashMap<>();
        for (Object[] row : userBookRepository.countFinishedByMonth(userId, since)) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            aggregated.put(YearMonth.of(year, month), count);
        }

        List<MonthlyCount> result = new ArrayList<>(MONTHS_WINDOW);
        for (int i = 0; i < MONTHS_WINDOW; i++) {
            YearMonth month = firstMonth.plusMonths(i);
            long count = aggregated.getOrDefault(month, 0L);
            // ISO YYYY-MM is what YearMonth.toString() emits already.
            result.add(new MonthlyCount(month.toString(), count));
        }
        return result;
    }

    private long countFinishedSince(Long userId, LocalDateTime since) {
        // The repository already returns per-month aggregates anchored at
        // `since`, so summing them gives us the total finished from that
        // moment to now without an extra query.
        return userBookRepository.countFinishedByMonth(userId, since).stream()
                .mapToLong(row -> ((Number) row[2]).longValue())
                .sum();
    }
}
