package com.interviewprep.platform.repository;

import com.interviewprep.platform.entity.Resume;
import com.interviewprep.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    Optional<Resume> findByUser(User user);
}
