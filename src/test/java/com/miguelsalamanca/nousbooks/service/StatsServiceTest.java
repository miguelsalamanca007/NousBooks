package com.miguelsalamanca.nousbooks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.miguelsalamanca.nousbooks.dto.StatsResponse;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.repository.NoteRepository;
import com.miguelsalamanca.nousbooks.repository.UserBookRepository;
import com.miguelsalamanca.nousbooks.support.TestData;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock private UserBookRepository userBookRepository;
    @Mock private NoteRepository noteRepository;
    @InjectMocks private StatsService statsService;

    @Test
    void getStatsFor_aggregatesCountsAndStatusBuckets() {
        User user = TestData.user(1L, "alice@example.com");
        when(userBookRepository.countByUserId(1L)).thenReturn(7L);
        when(noteRepository.countByUserId(1L)).thenReturn(12L);
        when(userBookRepository.countByUserIdAndStatus(1L, ReadingStatus.TO_READ)).thenReturn(3L);
        when(userBookRepository.countByUserIdAndStatus(1L, ReadingStatus.READING)).thenReturn(2L);
        when(userBookRepository.countByUserIdAndStatus(1L, ReadingStatus.READ)).thenReturn(2L);
        when(userBookRepository.countFinishedByMonth(eq(1L), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());

        StatsResponse stats = statsService.getStatsFor(user);

        assertThat(stats.getTotalBooks()).isEqualTo(7L);
        assertThat(stats.getTotalNotes()).isEqualTo(12L);
        assertThat(stats.getBooksByStatus()).containsEntry(ReadingStatus.TO_READ, 3L);
        assertThat(stats.getBooksByStatus()).containsEntry(ReadingStatus.READING, 2L);
        assertThat(stats.getBooksByStatus()).containsEntry(ReadingStatus.READ, 2L);
        assertThat(stats.getMemberSince()).isEqualTo(user.getCreatedAt());
    }

    @Test
    void getStatsFor_emitsTwelveContiguousMonthsEndingInCurrent() {
        User user = TestData.user(1L, "alice@example.com");
        when(userBookRepository.countByUserId(1L)).thenReturn(0L);
        when(noteRepository.countByUserId(1L)).thenReturn(0L);
        when(userBookRepository.countByUserIdAndStatus(eq(1L), any())).thenReturn(0L);

        YearMonth current = YearMonth.now();
        // Two arbitrary buckets — service should still emit 12 entries in order.
        List<Object[]> aggregate = List.of(
                new Object[]{current.getYear(), current.getMonthValue(), 4L},
                new Object[]{current.minusMonths(3).getYear(), current.minusMonths(3).getMonthValue(), 2L}
        );
        when(userBookRepository.countFinishedByMonth(eq(1L), any(LocalDateTime.class)))
                .thenReturn(aggregate);

        StatsResponse stats = statsService.getStatsFor(user);

        assertThat(stats.getFinishedByMonth()).hasSize(12);
        // First entry = 11 months before now
        assertThat(stats.getFinishedByMonth().get(0).getMonth())
                .isEqualTo(current.minusMonths(11).toString());
        // Last entry = current month with count = 4
        assertThat(stats.getFinishedByMonth().get(11).getMonth()).isEqualTo(current.toString());
        assertThat(stats.getFinishedByMonth().get(11).getCount()).isEqualTo(4L);
        // 3 months ago bucket has count 2
        assertThat(stats.getFinishedByMonth().get(8).getCount()).isEqualTo(2L);
        // Other months default to 0
        assertThat(stats.getFinishedByMonth().get(0).getCount()).isEqualTo(0L);
    }

    @Test
    void getStatsFor_sumsReadThisYearFromFinishedByMonthRows() {
        User user = TestData.user(1L, "alice@example.com");
        when(userBookRepository.countByUserId(1L)).thenReturn(0L);
        when(noteRepository.countByUserId(1L)).thenReturn(0L);
        when(userBookRepository.countByUserIdAndStatus(eq(1L), any())).thenReturn(0L);

        // The service calls countFinishedByMonth twice — once with "start of
        // year" (for readThisYear), once with "11 months ago" (for the chart).
        // We can't distinguish them from the mock, but summing always yields
        // the same value so the assertion still holds.
        when(userBookRepository.countFinishedByMonth(eq(1L), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{2025, 1, 1L},
                        new Object[]{2025, 3, 4L}
                ));

        StatsResponse stats = statsService.getStatsFor(user);

        assertThat(stats.getReadThisYear()).isEqualTo(5L);
    }
}
