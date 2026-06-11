package com.interviewprep.platform.controller;

import com.interviewprep.platform.dto.SubmitRequest;
import com.interviewprep.platform.entity.User;
import com.interviewprep.platform.service.InterviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateSession(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(interviewService.generateSession(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to generate session: " + e.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswers(@RequestBody SubmitRequest request,
                                           @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(interviewService.submitAnswers(request, user));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(interviewService.getHistory(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<?> getSessionDetails(@PathVariable UUID sessionId,
                                               @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(interviewService.getSessionDetails(sessionId, user));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(interviewService.getDashboardAnalytics(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
