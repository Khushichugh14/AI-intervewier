'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { 
  Mic, 
  MicOff, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import styles from './page.module.css';

export default function ActiveInterview() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active Session State
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // Array of { questionId, answer }
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // UI and Speech State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const recognitionRef = useRef(null);

  // Guard page access
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load session from local storage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('active_session_id');
    const savedQuestions = localStorage.getItem('active_questions');
    const savedIndex = localStorage.getItem('active_current_index');
    const savedAnswers = localStorage.getItem('active_answers');

    if (!savedSessionId || !savedQuestions) {
      router.push('/dashboard');
      return;
    }

    setSessionId(savedSessionId);
    
    const parsedQuestions = JSON.parse(savedQuestions);
    setQuestions(parsedQuestions);
    
    const idx = parseInt(savedIndex || '0', 10);
    setCurrentIndex(idx);
    
    const parsedAnswers = JSON.parse(savedAnswers || '[]');
    setAnswers(parsedAnswers);

    // Retrieve typed answer for current index if user is returning
    const existingAnswer = parsedAnswers.find(ans => ans.questionId === parsedQuestions[idx].id);
    if (existingAnswer) {
      setCurrentAnswer(existingAnswer.answer);
    }

    // Check speech recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && speechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setErrorMsg('');
      };

      rec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setCurrentAnswer(prev => {
          const space = prev.trim() ? ' ' : '';
          return prev + space + transcript;
        });
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please verify your browser permission settings.');
        } else {
          setErrorMsg('Voice input encountered an error. Please type or try again.');
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [speechSupported]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setErrorMsg('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        // Sometimes if instance is active, start throws. Recreate and trigger.
        setIsRecording(false);
      }
    }
  };

  const handleSaveCurrentAnswer = (answerText) => {
    const questionId = questions[currentIndex].id;
    const updatedAnswers = [...answers];
    const existingIndex = updatedAnswers.findIndex(ans => ans.questionId === questionId);

    if (existingIndex !== -1) {
      updatedAnswers[existingIndex].answer = answerText;
    } else {
      updatedAnswers.push({ questionId, answer: answerText });
    }

    setAnswers(updatedAnswers);
    localStorage.setItem('active_answers', JSON.stringify(updatedAnswers));
  };

  const handleNext = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    }

    // Save answer
    handleSaveCurrentAnswer(currentAnswer);

    // Proceed to next question index
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    localStorage.setItem('active_current_index', nextIndex.toString());

    // Load next question answer if present
    const nextQuestionId = questions[nextIndex].id;
    const nextExistingAnswer = answers.find(ans => ans.questionId === nextQuestionId);
    setCurrentAnswer(nextExistingAnswer ? nextExistingAnswer.answer : '');
    setErrorMsg('');
  };

  const handlePrev = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    }

    // Save current answer
    handleSaveCurrentAnswer(currentAnswer);

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    localStorage.setItem('active_current_index', prevIndex.toString());

    const prevQuestionId = questions[prevIndex].id;
    const prevExistingAnswer = answers.find(ans => ans.questionId === prevQuestionId);
    setCurrentAnswer(prevExistingAnswer ? prevExistingAnswer.answer : '');
    setErrorMsg('');
  };

  const handleSubmitInterview = async () => {
    if (isRecording) {
      recognitionRef.current.stop();
    }

    // Save last question answer
    handleSaveCurrentAnswer(currentAnswer);
    
    // Capture state values for submission
    const finalAnswers = [...answers];
    const questionId = questions[currentIndex].id;
    const existingIndex = finalAnswers.findIndex(ans => ans.questionId === questionId);
    if (existingIndex !== -1) {
      finalAnswers[existingIndex].answer = currentAnswer;
    } else {
      finalAnswers.push({ questionId, answer: currentAnswer });
    }

    setLoadingFeedback(true);
    setErrorMsg('');

    try {
      const result = await apiService.submitAnswers(sessionId, finalAnswers);
      
      // Clean local storage cache on successful submission
      localStorage.removeItem('active_session_id');
      localStorage.removeItem('active_questions');
      localStorage.removeItem('active_current_index');
      localStorage.removeItem('active_answers');

      // Redirect to feedback page
      router.push(`/history/${sessionId}`);
    } catch (err) {
      console.error('Error submitting mock interview:', err);
      setErrorMsg(err.message || 'Failed to submit interview answers. Please check your internet connection.');
      setLoadingFeedback(false);
    }
  };

  if (authLoading || !user || questions.length === 0) {
    return (
      <div className={styles.loaderContainer}>
        <div className="loader"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  if (loadingFeedback) {
    return (
      <div className={styles.feedbackLoaderContainer}>
        <div className={`${styles.feedbackLoaderContent} glass-panel`}>
          <div className="loader" style={{width: '60px', height: '60px', borderWidth: '4px'}}></div>
          <h2>Evaluating your Interview...</h2>
          <p className={styles.pulseText}>AI is scoring your answers</p>
          <div className={styles.loaderSteps}>
            <div className={styles.stepRow}><CheckCircle size={16} className={styles.activeCheck} /><span>Comparing answers with resume tech stack</span></div>
            <div className={styles.stepRow}><CheckCircle size={16} className={styles.activeCheck} /><span>Analyzing explanation depth and logic</span></div>
            <div className={styles.stepRow}><div className={styles.miniPulse}></div><span>Formulating strengths and improvements</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.interviewContainer} container animate-slide-up`}>
      {/* Top Header Card */}
      <section className={`${styles.headerPanel} glass-panel`}>
        <div className={styles.headerTitleRow}>
          <div className={styles.headerTitle}>
            <HelpCircle className={styles.helpIcon} />
            <span>Technical Session Practice</span>
          </div>
          <span className={styles.questionCounter}>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        
        {/* Progress bar */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar} style={{width: `${progressPercent}%`}}></div>
        </div>
      </section>

      {/* Main Question Card */}
      <section className={`${styles.questionCard} glass-panel`}>
        <div className={styles.badge}>Interviewer Prompt</div>
        <h2 className={styles.questionText}>{currentQuestion.question}</h2>
      </section>

      {/* Text/Voice Entry area */}
      <section className={`${styles.responseArea} glass-panel`}>
        <div className={styles.responseHeader}>
          <h3>Your Answer</h3>
          <span className={styles.wordCounter}>{currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0} words</span>
        </div>

        {errorMsg && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.textareaWrapper}>
          <textarea 
            className={styles.answerBox}
            placeholder="Type your answer in detail here, or click the mic to answer verbally..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
          ></textarea>

          {/* Equalizer overlay */}
          <AudioVisualizer isActive={isRecording} />
        </div>

        {/* Input helpers & Mic toggle */}
        <div className={styles.entryActions}>
          {speechSupported ? (
            <button 
              onClick={toggleRecording} 
              className={`${styles.micBtn} ${isRecording ? styles.recordingActive : ''}`}
            >
              {isRecording ? (
                <>
                  <MicOff size={18} />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>Answer Verbally</span>
                </>
              )}
            </button>
          ) : (
            <span className={styles.noSpeechMsg}>
              Voice input is not supported in this browser (Chrome recommended).
            </span>
          )}

          {currentAnswer.trim() && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your current typed answer?')) {
                  setCurrentAnswer('');
                }
              }} 
              className={styles.clearBtn}
              title="Clear answer"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* Nav Wizard Row */}
      <div className={styles.wizardNav}>
        <button 
          disabled={currentIndex === 0} 
          onClick={handlePrev} 
          className="btn-secondary"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {currentIndex < questions.length - 1 ? (
          <button 
            onClick={handleNext} 
            className="btn-primary"
          >
            <span>Next Question</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleSubmitInterview} 
            className={`${styles.finishBtn} btn-primary`}
          >
            <CheckCircle size={18} />
            <span>Finish & Submit</span>
          </button>
        )}
      </div>
    </div>
  );
}
