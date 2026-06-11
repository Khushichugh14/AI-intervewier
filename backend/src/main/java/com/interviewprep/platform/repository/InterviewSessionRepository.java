package com.interviewprep.platform.repository;

import com.interviewprep.platform.entity.InterviewSession;
import com.interviewprep.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    List<InterviewSession> findByUserOrderByCreatedAtDesc(User user);
}
