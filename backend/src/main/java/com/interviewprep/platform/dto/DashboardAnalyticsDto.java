package com.interviewprep.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardAnalyticsDto {
    private Integer totalInterviews;
    private Double averageScore;
    private List<String> weakAreas;
    private List<String> strongAreas;
    private List<SessionHistoryDto> sessionHistory;
}
