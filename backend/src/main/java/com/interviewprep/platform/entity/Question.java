package com.interviewprep.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "session")
@EqualsAndHashCode(exclude = "session")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonBackReference
    private InterviewSession session;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "feedback_strengths", columnDefinition = "TEXT")
    private String feedbackStrengths;

    @Column(name = "feedback_weaknesses", columnDefinition = "TEXT")
    private String feedbackWeaknesses;

    @Column(name = "feedback_improved", columnDefinition = "TEXT")
    private String feedbackImproved;

    private Integer score; // Score out of 10
}
