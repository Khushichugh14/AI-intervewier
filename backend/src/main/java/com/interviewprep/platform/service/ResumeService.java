package com.interviewprep.platform.service;

import com.interviewprep.platform.entity.Resume;
import com.interviewprep.platform.entity.User;
import com.interviewprep.platform.repository.ResumeRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;

    public ResumeService(ResumeRepository resumeRepository) {
        this.resumeRepository = resumeRepository;
    }

    @Transactional
    public Resume uploadAndParse(MultipartFile file, User user) throws IOException {
        String filename = Objects.requireNonNull(file.getOriginalFilename());
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        String extractedText = "";

        if ("pdf".equals(extension)) {
            extractedText = extractTextFromPdf(file);
        } else if ("docx".equals(extension)) {
            extractedText = extractTextFromDocx(file);
        } else {
            throw new IllegalArgumentException("Unsupported file type. Only PDF and DOCX are allowed.");
        }

        // If extraction yields no text, we still accept the file. Users can manually add content later.
        // Previously an exception was thrown here, which caused a 400 response for scanned PDFs.
        // Leaving the extractedText as an empty string allows the resume to be stored.
        // Optionally you could log a warning.
        if (extractedText.trim().isEmpty()) {
            System.out.println("[WARN] Uploaded resume contains no extractable text.");
        }

        // Check if user already has a resume
        Optional<Resume> existingResumeOpt = resumeRepository.findByUser(user);
        Resume resume;
        if (existingResumeOpt.isPresent()) {
            resume = existingResumeOpt.get();
            resume.setResumeText(extractedText);
            resume.setResumeUrl(filename); // simple mockup url/name
            resume.setUploadedAt(LocalDateTime.now());
        } else {
            resume = Resume.builder()
                    .user(user)
                    .resumeUrl(filename)
                    .resumeText(extractedText)
                    .build();
        }

        return resumeRepository.save(resume);
    }

    public Optional<Resume> getResumeForUser(User user) {
        return resumeRepository.findByUser(user);
    }

   private String extractTextFromPdf(MultipartFile file) throws IOException {
    try (PDDocument document = PDDocument.load(file.getInputStream())) {

        System.out.println("Pages: " + document.getNumberOfPages());

        if (document.isEncrypted()) {
            throw new IllegalArgumentException("Encrypted PDFs are not supported.");
        }

        PDFTextStripper stripper = new PDFTextStripper();
        String text = stripper.getText(document);

        System.out.println("Extracted text length: " + text.length());
        System.out.println("Preview: " +
                text.substring(0, Math.min(200, text.length())));

        return text;
    }
}

    private String extractTextFromDocx(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
}
