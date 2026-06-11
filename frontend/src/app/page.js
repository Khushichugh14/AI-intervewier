'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  UploadCloud, 
  Mic, 
  TrendingUp, 
  ArrowRight, 
  Mail, 
  Lock, 
  User as UserIcon,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const { user, login, register, loading } = useAuth();
  const router = useRouter();
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        router.push('/dashboard');
      } else {
        if (!name.trim()) throw new Error('Name is required');
        const msg = await register(name, email, password);
        setSuccess(msg || 'Registration successful! Please sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Landing Header */}
      <header className={styles.header}>
        <div className="container flex justify-between items-center" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px'}}>
          <div className={styles.logo}>
            <Compass className={styles.logoIcon} />
            <span>AI <span className="text-gradient">Interviewer</span></span>
          </div>
          <button onClick={() => {
            const authCard = document.getElementById('auth-section');
            if (authCard) authCard.scrollIntoView({ behavior: 'smooth' });
          }} className="btn-secondary">
            Sign In
          </button>
        </div>
      </header>

      {/* Hero & Auth Panel Split Section */}
      <section className={`${styles.heroSection} container`}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>Powered by OpenAI GPT-4o</div>
          <h1 className={styles.heroTitle}>
            Land Your Dream Job with <span className="text-gradient">AI Mock Interviews</span>
          </h1>
          <p className={styles.heroDescription}>
            Upload your resume, instantly generate tailormade technical questions, practice speaking your answers with voice-to-text input, and get comprehensive performance feedback.
          </p>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span>Resume-based personalized questions</span>
            </div>
            <div className={styles.featureItem}>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span>Real-time voice input transcription</span>
            </div>
            <div className={styles.featureItem}>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span>Scoring, strengths, weaknesses & ideal answers</span>
            </div>
          </div>
        </div>

        {/* Auth Form Card */}
        <div id="auth-section" className={`${styles.authCard} glass-panel animate-fade-in`}>
          <h2 className={styles.authTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className={styles.authSubtitle}>
            {isLogin ? 'Sign in to continue practicing' : 'Register to start your mock interviews'}
          </p>

          {error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className={styles.authForm}>
            {!isLogin && (
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <div className={styles.inputField}>
                  <UserIcon className={styles.inputIcon} size={18} />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <div className={styles.inputField}>
                <Mail className={styles.inputIcon} size={18} />
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <div className={styles.inputField}>
                <Lock className={styles.inputIcon} size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={authLoading} className={`${styles.submitBtn} btn-primary`}>
              {authLoading ? (
                <div className="loader" style={{width: '20px', height: '20px', borderWidth: '2px'}}></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Get Started'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className={styles.authToggle}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}>
              {isLogin ? 'Create one' : 'Sign in'}
            </span>
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>How It <span className="text-gradient">Works</span></h2>
          <div className={styles.stepsGrid}>
            <div className={`${styles.stepCard} glass-panel-interactive`}>
              <div className={`${styles.stepIconWrapper} ${styles.blueGlow}`}>
                <UploadCloud size={24} />
              </div>
              <h3>1. Upload Resume</h3>
              <p>Upload your PDF or DOCX resume. Our parser extracts your stack, skills, and projects.</p>
            </div>

            <div className={`${styles.stepCard} glass-panel-interactive`}>
              <div className={`${styles.stepIconWrapper} ${styles.cyanGlow}`}>
                <Compass size={24} />
              </div>
              <h3>2. AI Generates Questions</h3>
              <p>A simulated senior software engineering interviewer generates 10 tailored technical questions.</p>
            </div>

            <div className={`${styles.stepCard} glass-panel-interactive`}>
              <div className={`${styles.stepIconWrapper} ${styles.purpleGlow}`}>
                <Mic size={24} />
              </div>
              <h3>3. Verbal / Text Practice</h3>
              <p>Answer questions. Use Web Speech recognition to answer verbally for an immersive practice.</p>
            </div>

            <div className={`${styles.stepCard} glass-panel-interactive`}>
              <div className={`${styles.stepIconWrapper} ${styles.greenGlow}`}>
                <TrendingUp size={24} />
              </div>
              <h3>4. Deep Feedback</h3>
              <p>Receive individual question scoring, specific strengths, weaknesses, and a perfect sample answer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} AI Interview Preparation Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
