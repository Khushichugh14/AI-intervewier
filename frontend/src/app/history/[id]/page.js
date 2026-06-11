'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/api';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from './page.module.css';

export default function SessionFeedback() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id;

  // Feedback State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(0); // expand first question by default
  const [fetchError, setFetchError] = useState('');

  // Guard redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId || !user) return;
      setLoading(true);
      try {
        const data = await apiService.getSessionDetails(sessionId);
        setSession(data);
      } catch (error) {
        console.error('Error loading session feedback:', error);
        setFetchError('Failed to load session details. It may not exist or you might not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, user]);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? -1 : idx);
  };

  if (authLoading || !user) {
    return (
      <div className={styles.loaderContainer}>
        <div className="loader"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="loader"></div>
        <p style={{marginTop: '16px', color: 'var(--text-gray)'}}>Loading AI Evaluation Details...</p>
      </div>
    );
  }

  if (fetchError || !session) {
    return (
      <div className={`${styles.errorContainer} container`}>
        <div className={`${styles.errorCard} glass-panel`}>
          <XCircle size={48} className={styles.errorIcon} />
          <h2>Evaluation Not Found</h2>
          <p>{fetchError || 'Unable to retrieve interview session details.'}</p>
          <button className="btn-primary" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const overallScore = session.overallScore || 0;
  
  // SVG Circular progress constants
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 10) * circumference;

  return (
    <div className={`${styles.feedbackContainer} container animate-fade-in`}>
      {/* Back button */}
      <button className={`${styles.backBtn} btn-secondary`} onClick={() => router.push('/dashboard')}>
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      {/* Hero Summary Card */}
      <section className={`${styles.summaryCard} glass-panel`}>
        <div className={styles.summarySplit}>
          <div className={styles.summaryText}>
            <div className={styles.badge}>Completed Practice run</div>
            <h1 className={styles.title}>Interview Feedback Board</h1>
            <p className={styles.description}>
              Review the detailed analysis compiled by your AI interviewer. Expand individual questions below to see specific scoring, strengths, weak areas, and ideal sample answers.
            </p>
          </div>
          
          {/* Radial score badge */}
          <div className={styles.scoreGaugeContainer}>
            <div className={styles.svgWrapper}>
              <svg className={styles.svgCircle}>
                <circle 
                  className={styles.circleBg}
                  cx="70" 
                  cy="70" 
                  r={radius} 
                />
                <circle 
                  className={styles.circleProgress}
                  cx="70" 
                  cy="70" 
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className={styles.scoreTextWrapper}>
                <span className={styles.scoreNumber}>{overallScore}</span>
                <span className={styles.scoreMax}>/10</span>
              </div>
            </div>
            <div className={styles.scoreLabel}>
              <Award size={16} />
              <span>Overall Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Question Board */}
      <section className={styles.detailsSection}>
        <h2 className={styles.sectionTitle}>Question-by-Question Breakdown</h2>
        
        <div className={styles.questionsStack}>
          {session.evaluations.map((qEval, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div 
                key={qEval.questionId} 
                className={`${styles.questionItem} glass-panel`}
              >
                {/* Header Row (Click to toggle) */}
                <div 
                  className={styles.itemHeader}
                  onClick={() => toggleExpand(idx)}
                >
                  <div className={styles.headerTitleColumn}>
                    <span className={styles.numberIndex}>Q{idx + 1}</span>
                    <h3 className={styles.questionHeading}>{qEval.question}</h3>
                  </div>
                  
                  <div className={styles.headerStatusColumn}>
                    <span className={`${styles.questionScore} ${
                      qEval.score >= 8 ? styles.highColor :
                      qEval.score >= 6 ? styles.medColor :
                      styles.lowColor
                    }`}>
                      {qEval.score || 0}/10
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Collapsible content */}
                {isExpanded && (
                  <div className={styles.itemBody}>
                    
                    {/* User Answer block */}
                    <div className={styles.answerSection}>
                      <h4>
                        <MessageSquare size={16} />
                        <span>Your Response:</span>
                      </h4>
                      <p className={styles.answerText}>
                        {qEval.answer ? qEval.answer : <span style={{fontStyle: 'italic', color: 'var(--text-muted)'}}>No response provided.</span>}
                      </p>
                    </div>

                    {/* AI Feedback Split columns */}
                    <div className={styles.feedbackGrid}>
                      {/* Strengths card */}
                      <div className={`${styles.feedbackCard} ${styles.strengthCard}`}>
                        <div className={styles.cardHeader}>
                          <CheckCircle2 size={16} className={styles.greenCheck} />
                          <h5>Strengths & Key Details</h5>
                        </div>
                        <p>{qEval.strengths || 'N/A'}</p>
                      </div>

                      {/* Weaknesses card */}
                      <div className={`${styles.feedbackCard} ${styles.weaknessCard}`}>
                        <div className={styles.cardHeader}>
                          <XCircle size={16} className={styles.redX} />
                          <h5>Areas for Improvement</h5>
                        </div>
                        <p>{qEval.weaknesses || 'N/A'}</p>
                      </div>
                    </div>

                    {/* AI Suggested Answer */}
                    <div className={`${styles.suggestedSection} glass-panel`}>
                      <div className={styles.suggestedHeader}>
                        <Sparkles size={16} className={styles.purpleSparkle} />
                        <h5>AI Ideal Sample Answer:</h5>
                      </div>
                      <p className={styles.suggestedText}>{qEval.improvedAnswer}</p>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
