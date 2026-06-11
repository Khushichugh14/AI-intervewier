package com.interviewprep.platform.service;

import com.interviewprep.platform.dto.*;
import com.interviewprep.platform.entity.InterviewSession;
import com.interviewprep.platform.entity.Question;
import com.interviewprep.platform.entity.Resume;
import com.interviewprep.platform.entity.User;
import com.interviewprep.platform.repository.InterviewSessionRepository;
import com.interviewprep.platform.repository.QuestionRepository;
import com.interviewprep.platform.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final ResumeRepository resumeRepository;
    private final OpenAiService openAiService;

    public InterviewService(InterviewSessionRepository sessionRepository,
                            QuestionRepository questionRepository,
                            ResumeRepository resumeRepository,
                            OpenAiService openAiService) {
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.resumeRepository = resumeRepository;
        this.openAiService = openAiService;
    }

    /**
     * Generates a new interview session for the user.
     */
    @Transactional
    public SessionResponse generateSession(User user) {
        // If a user is authenticated, fetch their resume text. Otherwise, use empty string.
        String resumeText = "";
        if (user != null) {
            Resume resume = resumeRepository.findByUser(user)
                    .orElseThrow(() -> new IllegalArgumentException("Please upload your resume before starting an interview session."));
            resumeText = resume.getResumeText();
        }

        List<String> questionTexts = openAiService.generateQuestions(resumeText);

        InterviewSession session = InterviewSession.builder()
                .user(user) // may be null; relationship is optional
                .build();

        List<Question> questions = questionTexts.stream()
                .map(text -> Question.builder()
                        .session(session)
                        .question(text)
                        .build())
                .collect(Collectors.toList());

        session.setQuestions(questions);
        InterviewSession savedSession = sessionRepository.save(session);

        List<QuestionDto> questionDtos = savedSession.getQuestions().stream()
                .map(q -> QuestionDto.builder()
                        .id(q.getId())
                        .question(q.getQuestion())
                        .build())
                .collect(Collectors.toList());

        return SessionResponse.builder()
                .sessionId(savedSession.getId())
                .questions(questionDtos)
                .build();
    }

    /**
     * Submits and evaluates answers for an interview session.
     */
    @Transactional
    public SubmitResponse submitAnswers(SubmitRequest request, User user) {
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to this interview session");
        }

        Map<UUID, String> answersMap = request.getAnswers().stream()
                .collect(Collectors.toMap(AnswerRequest::getQuestionId, AnswerRequest::getAnswer, (a, b) -> a));

        int totalScore = 0;
        int questionsEvaluated = 0;

        List<QuestionEvaluationDto> evaluationDtos = new ArrayList<>();

        for (Question question : session.getQuestions()) {
            String answer = answersMap.getOrDefault(question.getId(), "");
            question.setAnswer(answer);

            // Call OpenAI or Mock evaluation
            Map<String, Object> evaluation = openAiService.evaluateAnswer(question.getQuestion(), answer);

            Integer score = (Integer) evaluation.get("score");
            String strengths = (String) evaluation.get("strengths");
            String weaknesses = (String) evaluation.get("weaknesses");
            String improvedAnswer = (String) evaluation.get("improvedAnswer");

            question.setScore(score);
            question.setFeedbackStrengths(strengths);
            question.setFeedbackWeaknesses(weaknesses);
            question.setFeedbackImproved(improvedAnswer);

            totalScore += score;
            questionsEvaluated++;

            evaluationDtos.add(QuestionEvaluationDto.builder()
                    .questionId(question.getId())
                    .question(question.getQuestion())
                    .answer(answer)
                    .score(score)
                    .strengths(strengths)
                    .weaknesses(weaknesses)
                    .improvedAnswer(improvedAnswer)
                    .build());
        }

        int overallScore = questionsEvaluated > 0 ? Math.round((float) totalScore / questionsEvaluated) : 0;
        session.setScore(overallScore);
        sessionRepository.save(session);

        return SubmitResponse.builder()
                .sessionId(session.getId())
                .overallScore(overallScore)
                .evaluations(evaluationDtos)
                .build();
    }

    /**
     * Retrieves session history list.
     */
    public List<SessionHistoryDto> getHistory(User user) {
        return sessionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .filter(session -> session.getScore() != null) // only completed sessions
                .map(session -> SessionHistoryDto.builder()
                        .id(session.getId())
                        .score(session.getScore())
                        .createdAt(session.getCreatedAt())
                        .questionCount(session.getQuestions().size())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Retrieves details of a specific interview session.
     */
    public SubmitResponse getSessionDetails(UUID sessionId, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to this interview session");
        }

        List<QuestionEvaluationDto> evaluations = session.getQuestions().stream()
                .map(q -> QuestionEvaluationDto.builder()
                        .questionId(q.getId())
                        .question(q.getQuestion())
                        .answer(q.getAnswer())
                        .score(q.getScore())
                        .strengths(q.getFeedbackStrengths())
                        .weaknesses(q.getFeedbackWeaknesses())
                        .improvedAnswer(q.getFeedbackImproved())
                        .build())
                .collect(Collectors.toList());

        return SubmitResponse.builder()
                .sessionId(session.getId())
                .overallScore(session.getScore())
                .evaluations(evaluations)
                .build();
    }

    /**
     * Compiles dashboard analytics metrics.
     */
    public DashboardAnalyticsDto getDashboardAnalytics(User user) {
        List<InterviewSession> sessions = sessionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .filter(session -> session.getScore() != null)
                .collect(Collectors.toList());

        int totalInterviews = sessions.size();
        double averageScore = totalInterviews > 0
                ? sessions.stream().mapToInt(InterviewSession::getScore).average().orElse(0.0)
                : 0.0;

        // Round average score to 1 decimal place
        averageScore = Math.round(averageScore * 10.0) / 10.0;

        List<SessionHistoryDto> history = sessions.stream()
                .map(session -> SessionHistoryDto.builder()
                        .id(session.getId())
                        .score(session.getScore())
                        .createdAt(session.getCreatedAt())
                        .questionCount(session.getQuestions().size())
                        .build())
                .collect(Collectors.toList());

        // Dynamic category analysis based on keywords
        Map<String, List<Integer>> topicScores = new HashMap<>();

        for (InterviewSession s : sessions) {
            for (Question q : s.getQuestions()) {
                if (q.getScore() != null) {
                    String topic = categorizeQuestion(q.getQuestion());
                    topicScores.computeIfAbsent(topic, k -> new ArrayList<>()).add(q.getScore());
                }
            }
        }

        List<String> strongAreas = new ArrayList<>();
        List<String> weakAreas = new ArrayList<>();

        for (Map.Entry<String, List<Integer>> entry : topicScores.entrySet()) {
            double avg = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0);
            if (avg >= 7.5) {
                strongAreas.add(entry.getKey());
            } else {
                weakAreas.add(entry.getKey());
            }
        }

        // Default placeholders if there isn't enough data
        if (totalInterviews == 0) {
            strongAreas.add("N/A (Upload resume & take an interview)");
            weakAreas.add("N/A (Upload resume & take an interview)");
        } else {
            if (strongAreas.isEmpty()) {
                // If there are no strong areas, find the highest scoring one
                topicScores.entrySet().stream()
                        .max(Comparator.comparingDouble(e -> e.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0)))
                        .ifPresent(e -> strongAreas.add(e.getKey()));
            }
            if (weakAreas.isEmpty()) {
                // If there are no weak areas, find the lowest scoring one (that is not in strong)
                topicScores.entrySet().stream()
                        .min(Comparator.comparingDouble(e -> e.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0)))
                        .filter(e -> !strongAreas.contains(e.getKey()))
                        .ifPresent(e -> weakAreas.add(e.getKey()));
            }
        }

        return DashboardAnalyticsDto.builder()
                .totalInterviews(totalInterviews)
                .averageScore(averageScore)
                .strongAreas(strongAreas)
                .weakAreas(weakAreas)
                .sessionHistory(history)
                .build();
    }

    private String categorizeQuestion(String question) {
        String q = question.toLowerCase();
        if (q.contains("spring") || q.contains("jpa") || q.contains("hibernate") || q.contains("java") || q.contains("garbage") || q.contains("bean")) {
            return "Java & Spring Boot";
        }
        if (q.contains("react") || q.contains("next") || q.contains("css") || q.contains("html") || q.contains("dom") || q.contains("rendering")) {
            return "Frontend Development (React/Next.js)";
        }
        if (q.contains("javascript") || q.contains("closure") || q.contains("event loop") || q.contains("promise") || q.contains("async")) {
            return "JavaScript Fundamentals";
        }
        if (q.contains("database") || q.contains("sql") || q.contains("index") || q.contains("acid") || q.contains("postgres") || q.contains("n+1")) {
            return "Databases (SQL/NoSQL)";
        }
        if (q.contains("docker") || q.contains("kubernetes") || q.contains("containers") || q.contains("ci/cd") || q.contains("deploy")) {
            return "DevOps & Infrastructure";
        }
        if (q.contains("scaling") || q.contains("architecture") || q.contains("microservice") || q.contains("ha") || q.contains("rest") || q.contains("graphql")) {
            return "System Design & APIs";
        }
        return "Core Computer Science";
    }
}
