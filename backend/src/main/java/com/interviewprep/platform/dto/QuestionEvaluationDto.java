package com.interviewprep.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionEvaluationDto {
    private UUID questionId;
    private String question;
    private String answer;
    private Integer score;
    private String strengths;
    private String weaknesses;
    private String improvedAnswer;
}
