package com.interviewprep.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionHistoryDto {
    private UUID id;
    private Integer score;
    private LocalDateTime createdAt;
    private Integer questionCount;
}
