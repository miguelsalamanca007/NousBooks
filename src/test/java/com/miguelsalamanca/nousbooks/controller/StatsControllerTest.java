package com.miguelsalamanca.nousbooks.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.miguelsalamanca.nousbooks.config.SecurityConfig;
import com.miguelsalamanca.nousbooks.dto.StatsResponse;
import com.miguelsalamanca.nousbooks.dto.StatsResponse.MonthlyCount;
import com.miguelsalamanca.nousbooks.enums.ReadingStatus;
import com.miguelsalamanca.nousbooks.model.User;
import com.miguelsalamanca.nousbooks.security.JwtAuthFilter;
import com.miguelsalamanca.nousbooks.service.StatsService;
import com.miguelsalamanca.nousbooks.support.TestData;
import com.miguelsalamanca.nousbooks.support.TestSecurityConfig;

@WebMvcTest(
        controllers = StatsController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@Import(TestSecurityConfig.class)
class StatsControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private StatsService statsService;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getMyStats_returnsPayload() throws Exception {
        User currentUser = TestData.user(1L, "alice@example.com");
        Map<ReadingStatus, Long> byStatus = new EnumMap<>(ReadingStatus.class);
        byStatus.put(ReadingStatus.TO_READ, 1L);
        byStatus.put(ReadingStatus.READING, 2L);
        byStatus.put(ReadingStatus.READ, 3L);

        StatsResponse stats = new StatsResponse(
                6L,
                byStatus,
                12L,
                4L,
                List.of(new MonthlyCount("2025-05", 4L)),
                LocalDateTime.of(2024, 1, 1, 0, 0));
        when(statsService.getStatsFor(any(User.class))).thenReturn(stats);

        mockMvc.perform(get("/api/stats/me").with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBooks").value(6))
                .andExpect(jsonPath("$.totalNotes").value(12))
                .andExpect(jsonPath("$.readThisYear").value(4))
                .andExpect(jsonPath("$.booksByStatus.READ").value(3))
                .andExpect(jsonPath("$.finishedByMonth[0].month").value("2025-05"))
                .andExpect(jsonPath("$.finishedByMonth[0].count").value(4));
    }
}
