'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { ResumeUpload } from '../../components/ResumeUpload';
import { 
  Award, 
  History as HistoryIcon, 
  Play, 
  FileText, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  BrainCircuit,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import styles from './page.module.css';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Component State
  const [resumeName, setResumeName] = useState('');
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0.0,
    strongAreas: [],
    weakAreas: []
  });
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [startError, setStartError] = useState('');
  const [sessionGenerating, setSessionGenerating] = useState(false);

  // Auth Guard redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      // Fetch resume info
      const resumeInfo = await apiService.getResume();
      if (resumeInfo && resumeInfo.fileName) {
        setResumeName(resumeInfo.fileName);
      }

      // Fetch analytics (overall stats + history list)
      const analytics = await apiService.getAnalytics();
      setStats({
        totalInterviews: analytics.totalInterviews || 0,
        averageScore: analytics.averageScore || 0.0,
        strongAreas: analytics.strongAreas || [],
        weakAreas: analytics.weakAreas || []
      });

      const historyData = analytics.sessionHistory || [];
      setHistory(historyData);

      // Process history data for chart
      const chartPoints = [...historyData]
        .reverse() // chronologically ordered (oldest to newest)
        .map(session => {
          const date = new Date(session.createdAt);
          return {
            date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: session.score
          };
        });
      setChartData(chartPoints);
      
    } catch (error) {
      console.error('Error fetching dashboard details:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleResumeUploadSuccess = (fileName) => {
    setResumeName(fileName);
    setStartError('');
  };

  const handleStartInterview = async () => {
    if (!resumeName) {
      setStartError('You must upload a resume before you can generate a mock interview session.');
      return;
    }
    setSessionGenerating(true);
    setStartError('');
    try {
      const response = await apiService.generateSession();
      // Store questions and session ID in local storage to keep state across page refresh
      localStorage.setItem('active_session_id', response.sessionId);
      localStorage.setItem('active_questions', JSON.stringify(response.questions));
      localStorage.setItem('active_current_index', '0');
      localStorage.setItem('active_answers', JSON.stringify([]));

      router.push('/interview');
    } catch (error) {
      console.error('Error starting interview session:', error);
      setStartError(error.message || 'Failed to start interview. Please try again.');
    } finally {
      setSessionGenerating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className={styles.loaderContainer}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboardContainer} container animate-fade-in`}>
      {/* Welcome banner */}
      <section className={styles.welcomeBanner}>
        <div>
          <h1>Welcome, {user.name}!</h1>
          <p>Prepare for your next technical interview with real-time feedback.</p>
        </div>
        <div className={styles.bannerDate}>
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </section>

      {/* Analytics stats row */}
      {dataLoading ? (
        <div className={styles.statsSkeleton}>
          <div className="loader" style={{margin: '0 auto'}}></div>
        </div>
      ) : (
        <section className={styles.statsGrid}>
          {/* Card 1: Total Sessions */}
          <div className={`${styles.statsCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Interviews Taken</span>
              <div className={`${styles.cardIconWrapper} ${styles.blueIcon}`}>
                <HistoryIcon size={20} />
              </div>
            </div>
            <div className={styles.cardValue}>{stats.totalInterviews}</div>
            <span className={styles.cardSubtext}>Completed sessions</span>
          </div>

          {/* Card 2: Average Score */}
          <div className={`${styles.statsCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Average Score</span>
              <div className={`${styles.cardIconWrapper} ${styles.cyanIcon}`}>
                <Award size={20} />
              </div>
            </div>
            <div className={styles.scoreRow}>
              <div className={styles.cardValue}>{stats.averageScore}</div>
              <span className={styles.maxScore}>/10</span>
            </div>
            <span className={styles.cardSubtext}>Across all domains</span>
          </div>

          {/* Card 3: Strong areas */}
          <div className={`${styles.statsCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Strong Areas</span>
              <div className={`${styles.cardIconWrapper} ${styles.greenIcon}`}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div className={styles.pillsList}>
              {stats.strongAreas.length > 0 ? (
                stats.strongAreas.map((area, idx) => (
                  <span key={idx} className={`${styles.pill} ${styles.pillStrong}`}>{area}</span>
                ))
              ) : (
                <span className={styles.noDataPill}>No interview data yet</span>
              )}
            </div>
          </div>

          {/* Card 4: Weak areas */}
          <div className={`${styles.statsCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Needs Review</span>
              <div className={`${styles.cardIconWrapper} ${styles.purpleIcon}`}>
                <TrendingDown size={20} />
              </div>
            </div>
            <div className={styles.pillsList}>
              {stats.weakAreas.length > 0 ? (
                stats.weakAreas.map((area, idx) => (
                  <span key={idx} className={`${styles.pill} ${styles.pillWeak}`}>{area}</span>
                ))
              ) : (
                <span className={styles.noDataPill}>No interview data yet</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Splits */}
      <div className={styles.mainGrid}>
        
        {/* Left Column (Resume + Action + History List) */}
        <div className={styles.leftColumn}>
          {/* Resume Upload Panel */}
          <div className={`${styles.panelCard} glass-panel`}>
            <h2 className={styles.panelTitle}>
              <FileText size={20} className={styles.titleIcon} />
              <span>Resume Configuration</span>
            </h2>
            <p className={styles.panelDesc}>
              Upload your resume so our AI can extract your domain expertise and projects to generate custom questions.
            </p>
            <ResumeUpload 
              activeResumeName={resumeName} 
              onUploadSuccess={handleResumeUploadSuccess} 
            />
          </div>

          {/* Start Interview Session */}
          <div className={`${styles.panelCard} glass-panel ${styles.startInterviewPanel}`}>
            <h2 className={styles.panelTitle}>
              <BrainCircuit size={20} className={styles.titleIcon} />
              <span>Simulated Interview</span>
            </h2>
            <p className={styles.panelDesc}>
              Start a custom 10-question practice run. You can answer textually or verbally with speech-to-text input.
            </p>
            
            {startError && (
              <div className={`${styles.alert} ${styles.alertWarning}`}>
                <AlertTriangle size={18} />
                <span>{startError}</span>
              </div>
            )}

            <button 
              disabled={sessionGenerating}
              onClick={handleStartInterview} 
              className={`${styles.startBtn} btn-primary`}
            >
              {sessionGenerating ? (
                <div className="loader" style={{width: '20px', height: '20px', borderWidth: '2px'}}></div>
              ) : (
                <>
                  <Play size={18} />
                  <span>{resumeName ? 'Start Practice Session' : 'Upload Resume to Practice'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Recent History Table */}
          <div className={`${styles.panelCard} glass-panel`}>
            <h2 className={styles.panelTitle}>
              <HistoryIcon size={20} className={styles.titleIcon} />
              <span>Interview History</span>
            </h2>
            
            {dataLoading ? (
              <div style={{display: 'flex', justifyContent: 'center', padding: '40px 0'}}>
                <div className="loader"></div>
              </div>
            ) : history.length === 0 ? (
              <div className={styles.noHistory}>
                <p>No completed interviews found. Start your first session above!</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Questions</th>
                      <th>Score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((session) => (
                      <tr key={session.id}>
                        <td>
                          {new Date(session.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td>{session.questionCount} Questions</td>
                        <td>
                          <span className={`${styles.scoreTag} ${
                            session.score >= 8 ? styles.scoreHigh :
                            session.score >= 6 ? styles.scoreMedium :
                            styles.scoreLow
                          }`}>
                            {session.score}/10
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => router.push(`/history/${session.id}`)}
                            className={styles.viewFeedbackBtn}
                          >
                            <span>Feedback</span>
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Analytics Chart Panel) */}
        <div className={styles.rightColumn}>
          <div className={`${styles.panelCard} glass-panel ${styles.chartPanel}`}>
            <h2 className={styles.panelTitle}>
              <TrendingUp size={20} className={styles.titleIcon} />
              <span>Performance Trend</span>
            </h2>
            <p className={styles.panelDesc}>
              Monitor your scoring improvement over historical interview practices.
            </p>

            {dataLoading ? (
              <div style={{display: 'flex', justifyContent: 'center', height: '300px', alignItems: 'center'}}>
                <div className="loader"></div>
              </div>
            ) : chartData.length === 0 ? (
              <div className={styles.noChartData}>
                <TrendingUp size={48} className={styles.chartPlaceholderIcon} />
                <p>We'll plot your score progression here once you complete a mock interview!</p>
              </div>
            ) : (
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-cyan)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-muted)" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      ticks={[0, 2, 4, 6, 8, 10]}
                      stroke="var(--text-muted)" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--bg-obsidian)', 
                        borderColor: 'var(--bg-glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-white)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="var(--primary-cyan)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
