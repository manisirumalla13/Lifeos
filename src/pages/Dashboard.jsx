import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import LifePlanet from '../components/3d/LifePlanet';
import {
  CheckSquare,
  Clock,
  Zap,
  Award,
  Activity,
  Sun,
  Timer,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Check,
  Flame,
  Radio,
  Layers,
} from 'lucide-react';

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0 },
    studyTime: 0,
    habits: 0,
    goalsProgress: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [session]);

  const fetchStats = async () => {
    try {
      const userId = session.user.id;
      const [{ data: t }, { data: study }, { data: goals }, { data: h }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('study_sessions').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('habits').select('*, habit_completions(*)').eq('user_id', userId),
      ]);

      const allTasks = t || [];
      setTasks(allTasks);
      setHabits(h || []);

      const completedTasks = allTasks.filter((item) => item.is_completed).length;
      const totalStudyMinutes = study ? study.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) : 0;
      const avgGoalProgress = goals && goals.length > 0
        ? goals.reduce((acc, curr) => acc + (curr.current_progress || 0), 0) / goals.length
        : 0;

      setStats({
        tasks: { total: allTasks.length, completed: completedTasks },
        studyTime: totalStudyMinutes,
        habits: h ? h.length : 0,
        goalsProgress: Math.round(avgGoalProgress),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (id, isCompleted) => {
    await supabase.from('tasks').update({ is_completed: !isCompleted }).eq('id', id);
    fetchStats();
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const efficiency = stats.tasks.total > 0
    ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
    : 100;

  // Circular gauge values
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const efficiencyOffset = circumference - (efficiency / 100) * circumference;
  const goalsOffset = circumference - (stats.goalsProgress / 100) * circumference;

  return (
    <div className="page active">
      {/* Top Window Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="window-dots">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            LifeOS // Core Neural Dashboard
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge" style={{ borderColor: 'rgba(0, 242, 254, 0.4)', color: 'var(--accent-cyan)' }}>
            <Radio size={12} style={{ animation: 'pulseGlow 2s infinite' }} /> Orbit Telemetry Active
          </span>
          <span className="badge">
            <Zap size={12} color="#f59e0b" /> Sync Stable
          </span>
        </div>
      </div>

      {/* Main Holographic Centerpiece Hero */}
      <div className="hero-dashboard">
        <div className="welcome-text">
          <h1>
            Welcome back, <span className="highlight">{session.user.email.split('@')[0]}</span>
          </h1>
          <p className="subtitle">
            All systems synchronized: cognitive focus, habit continuity, task velocity, and temporal planning.
          </p>

          {/* Quick Action Navigation Pills */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/my-day')}
              className="primary-btn"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <Sun size={15} /> Daily Planner
            </button>
            <button
              onClick={() => navigate('/focus')}
              className="secondary-btn"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Timer size={15} color="var(--accent-cyan)" /> Focus Mode
            </button>
            <button
              onClick={() => navigate('/assistant')}
              className="secondary-btn"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Sparkles size={15} color="var(--accent-pink)" /> LifeMate AI
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="secondary-btn"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <CalendarDays size={15} color="#38bdf8" /> Calendar
            </button>
          </div>

          {/* Dual Holographic Circular Gauges */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Gauge 1: Goals Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="url(#cyanGlow)"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={goalsOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <defs>
                    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                  {stats.goalsProgress}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Objectives</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Goal Maturity</div>
              </div>
            </div>

            {/* Gauge 2: Neural Efficiency */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="url(#purpleGlow)"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={efficiencyOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <defs>
                    <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                  {efficiency}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Efficiency</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Neural Output</div>
              </div>
            </div>
          </div>
        </div>

        {/* Centerpiece Holographic Orbital Fluid Animation */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 310 }}>
          <LifePlanet />
        </div>
      </div>

      {/* 4 Telemetry Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper purple">
            <CheckSquare size={24} />
          </div>
          <div className="stat-info">
            <h4>
              {stats.tasks.completed}/{stats.tasks.total}
            </h4>
            <p>Tasks Completed</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h4>{stats.studyTime}m</h4>
            <p>Study Immersion</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper green">
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <h4>{stats.habits} Active</h4>
            <p>Habits Tracked</p>
          </div>
        </div>
      </div>

      {/* Live Sections: Upcoming Focus Tasks + Habit Continuity Matrix */}
      <div className="dashboard-sections">
        {/* Live Upcoming Focus List */}
        <div className="card glass upcoming-tasks" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="window-header">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span className="window-title">Upcoming Task Queue</span>
            <Link to="/tasks" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <p className="empty-state">No immediate deadlines detected. All caught up!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--card-border)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => handleToggleTask(t.id, t.is_completed)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: '1px solid var(--accent-cyan)',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      {t.is_completed && <Check size={13} color="var(--accent-cyan)" />}
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{t.title}</span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      background:
                        t.priority === 'High'
                          ? 'rgba(239, 68, 68, 0.18)'
                          : t.priority === 'Medium'
                          ? 'rgba(0, 242, 254, 0.18)'
                          : 'rgba(16, 185, 129, 0.18)',
                      color:
                        t.priority === 'High'
                          ? '#f87171'
                          : t.priority === 'Medium'
                          ? 'var(--accent-cyan)'
                          : '#34d399',
                      border:
                        t.priority === 'High'
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : t.priority === 'Medium'
                          ? '1px solid rgba(0, 242, 254, 0.3)'
                          : '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habit Continuity Matrix */}
        <div className="card glass">
          <div className="window-header">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span className="window-title">Habit Continuity Matrix</span>
            <Link to="/habits" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Habits <ArrowRight size={12} />
            </Link>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
            Multi-day consistency matrix. Each glowing node represents execution.
          </p>

          {/* Glowing matrix dots visualization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {habits.slice(0, 3).map((h) => {
              const completions = h.habit_completions || [];
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.title}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: 8 }).map((_, i) => {
                      const isFilled = i < Math.min(8, completions.length || 3);
                      return (
                        <div
                          key={i}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            background: isFilled
                              ? i % 2 === 0
                                ? '#00f2fe'
                                : '#a855f7'
                              : 'rgba(255, 255, 255, 0.08)',
                            boxShadow: isFilled
                              ? i % 2 === 0
                                ? '0 0 8px #00f2fe'
                                : '0 0 8px #a855f7'
                              : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {habits.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No routines configured yet.</p>
            )}
          </div>

          {/* Efficiency Bar at bottom */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>System Neural Output</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{efficiency}%</span>
            </div>
            <div className="efficiency-bar-container" style={{ marginTop: 0 }}>
              <div className="efficiency-bar" style={{ width: `${efficiency}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
