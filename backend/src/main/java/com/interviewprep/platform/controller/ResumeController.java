package com.interviewprep.platform.controller;

import com.interviewprep.platform.entity.Resume;
import com.interviewprep.platform.entity.User;
import com.interviewprep.platform.service.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file,
                                          @AuthenticationPrincipal User user) {
        try {
            Resume resume = resumeService.uploadAndParse(file, user);
            return ResponseEntity.ok(Map.of(
                    "id", resume.getId(),
                    "fileName", resume.getResumeUrl(),
                    "message", "Resume uploaded and parsed successfully!"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getResume(@AuthenticationPrincipal User user) {
        Optional<Resume> resumeOpt = resumeService.getResumeForUser(user);
        if (resumeOpt.isPresent()) {
            Resume resume = resumeOpt.get();
            return ResponseEntity.ok(Map.of(
                    "id", resume.getId(),
                    "fileName", resume.getResumeUrl(),
                    "uploadedAt", resume.getUploadedAt(),
                    "resumeText", resume.getResumeText()
            ));
        } else {
            return ResponseEntity.ok(Map.of("message", "No resume found. Please upload one."));
        }
    }
}
