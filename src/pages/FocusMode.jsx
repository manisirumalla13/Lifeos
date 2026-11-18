import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import {
  Play, Pause, RotateCcw, Coffee, Maximize, Minimize,
  Volume2, VolumeX, Timer, Zap, Moon, Sun, TreePine,
  Waves, CloudRain, Settings
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playNotificationTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
    setTimeout(() => ctx.close(), 1200);
  } catch (_) { /* ignore */ }
}

// ── Ambient Sound Engine ─────────────────────────────────────────────

class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.gainNode = null;
    this.active = false;
    this.type = 'silence';
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.3;
    this.gainNode.connect(this.ctx.destination);
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(_){} });
    this.nodes = [];
    this.active = false;
  }

  play(type, volume) {
    this.init();
    this.stop();
    if (type === 'silence') { this.type = type; return; }
    this.type = type;
    this.active = true;
    this.gainNode.gain.value = volume;

    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();

    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.7;
      noise.connect(filter).connect(this.gainNode);
    } else if (type === 'ocean') {
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      filter.Q.value = 1;
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      noise.connect(filter).connect(this.gainNode);
      this.nodes.push(lfo, lfoGain);
    } else if (type === 'forest') {
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.6;
      noise.connect(filter).connect(subGain).connect(this.gainNode);
      this.nodes.push(subGain);
    }

    noise.start();
    this.nodes.push(noise, filter);
  }

  setVolume(v) {
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  destroy() {
    this.stop();
    if (this.ctx) { try { this.ctx.close(); } catch(_){} this.ctx = null; }
  }
}

// ── Particle Background ──────────────────────────────────────────────

function useParticles(canvasRef, isBreak) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const maxCount = isBreak ? 25 : 60;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: maxCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, isBreak]);
}

// ── Component ────────────────────────────────────────────────────────

export default function FocusMode({ session }) {
  // Timer state
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('work'); // 'work' | 'break'
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showBreakOverlay, setShowBreakOverlay] = useState(false);

  // Setup
  const [focusTopic, setFocusTopic] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Ambient
  const [ambientType, setAmbientType] = useState('silence');
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [ambientOn, setAmbientOn] = useState(false);
  const ambientRef = useRef(null);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // History
  const [todaySessions, setTodaySessions] = useState([]);

  // Refs
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);

  // Particles
  useParticles(canvasRef, phase === 'break');

  // ── Ambient Engine lifecycle ──

  useEffect(() => {
    ambientRef.current = new AmbientEngine();
    return () => ambientRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (ambientOn && ambientRef.current) {
      ambientRef.current.play(ambientType, ambientVolume);
    } else {
      ambientRef.current?.stop();
    }
  }, [ambientOn, ambientType]);

  useEffect(() => {
    ambientRef.current?.setVolume(ambientVolume);
  }, [ambientVolume]);

  // ── Fullscreen listener ──

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Fetch today's sessions ──

  const fetchTodaySessions = useCallback(async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('completed_at', todayStart.toISOString())
        .order('completed_at', { ascending: false });
      if (data) setTodaySessions(data);
    } catch (_) { /* table may not exist */ }
  }, [session.user.id]);

  useEffect(() => { fetchTodaySessions(); }, [fetchTodaySessions]);

  // ── Save session ──

  const saveSession = useCallback(async (durationMin) => {
    try {
      await supabase.from('focus_sessions').insert({
        user_id: session.user.id,
        focus_topic: focusTopic || 'Untitled',
        duration_minutes: durationMin,
        completed_at: new Date().toISOString(),
        session_type: 'pomodoro',
      });
      fetchTodaySessions();
    } catch (_) { /* table may not exist */ }
  }, [session.user.id, focusTopic, fetchTodaySessions]);

  // ── Timer logic ──

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          playNotificationTone();
          if (phase === 'work') {
            const newCount = sessionsCompleted + 1;
            setSessionsCompleted(newCount);
            saveSession(workDuration);
            setShowBreakOverlay(true);
            setPhase('break');
            setIsRunning(false);
            return breakDuration * 60;
          } else {
            setPhase('work');
            setIsRunning(false);
            return workDuration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, workDuration, breakDuration, sessionsCompleted, saveSession]);

  // ── Controls ──

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setPhase('work');
    setTimeLeft(workDuration * 60);
    setShowBreakOverlay(false);
  };

  const selectDuration = (min) => {
    setWorkDuration(min);
    if (!isRunning && phase === 'work') setTimeLeft(min * 60);
  };

  const handleCustomDuration = () => {
    const v = parseInt(customDuration, 10);
    if (v > 0 && v <= 180) selectDuration(v);
    setCustomDuration('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const startBreak = () => {
    setShowBreakOverlay(false);
    setIsRunning(true);
  };

  const skipBreak = () => {
    setShowBreakOverlay(false);
    setPhase('work');
    setTimeLeft(workDuration * 60);
  };

  // ── SVG progress ──

  const totalDuration = phase === 'work' ? workDuration * 60 : breakDuration * 60;
  const progress = 1 - timeLeft / totalDuration;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // ── Stats ──

  const totalFocusToday = todaySessions.reduce((s, r) => s + (r.duration_minutes || 0), 0);
  const sessionsToday = todaySessions.length;

  // ── Preset buttons ──
  const presets = [15, 25, 45, 60, 90];

  const ambientOptions = [
    { key: 'silence', label: 'Silence', icon: <VolumeX size={16} /> },
    { key: 'rain', label: 'Rain', icon: <CloudRain size={16} /> },
    { key: 'ocean', label: 'Ocean', icon: <Waves size={16} /> },
    { key: 'forest', label: 'Forest', icon: <TreePine size={16} /> },
  ];

  const breakSuggestions = [
    { label: 'Stretch', emoji: '🧘' },
    { label: 'Hydrate', emoji: '💧' },
    { label: 'Walk', emoji: '🚶' },
    { label: 'Breathe', emoji: '🌬️' },
  ];

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="page active" style={styles.wrapper}>
      <style>{cssText}</style>
      <canvas ref={canvasRef} style={styles.particleCanvas} />

      {/* ── Break Overlay ── */}
      {showBreakOverlay && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <Coffee size={48} style={{ color: 'var(--accent-emerald)', marginBottom: 16 }} />
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Time for a break!</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
              You've completed {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}. Choose an activity:
            </p>
            <div style={styles.breakGrid}>
              {breakSuggestions.map(s => (
                <button key={s.label} style={styles.breakBtn} onClick={startBreak}>
                  <span style={{ fontSize: 28 }}>{s.emoji}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{s.label}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="fm-primary-btn" onClick={startBreak}>Start Break ({breakDuration}m)</button>
              <button className="fm-secondary-btn" onClick={skipBreak}>Skip Break</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div style={styles.mainLayout}>
        {/* Left — Timer area */}
        <div style={styles.timerArea}>
          {/* Top bar */}
          {!isFullscreen && (
            <div style={styles.topBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Timer size={20} style={{ color: 'var(--accent-purple)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18 }}>Focus Mode</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="fm-icon-btn" onClick={() => setShowSettings(v => !v)} title="Settings">
                  <Settings size={18} />
                </button>
                <button className="fm-icon-btn" onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Phase label */}
          <div style={styles.phaseLabel}>
            {phase === 'work'
              ? <><Zap size={16} style={{ color: 'var(--accent-purple)' }} /> Work</>
              : <><Moon size={16} style={{ color: 'var(--accent-emerald)' }} /> Break</>}
          </div>

          {/* Focus topic */}
          {!isFullscreen && (
            <input
              type="text"
              placeholder="What are you focusing on?"
              value={focusTopic}
              onChange={e => setFocusTopic(e.target.value)}
              style={styles.topicInput}
            />
          )}

          {/* SVG Timer */}
          <div style={styles.timerContainer}>
            <svg width="320" height="320" viewBox="0 0 320 320" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 0 20px rgba(0, 242, 254, 0.45))' }}>
              <circle
                cx="160" cy="160" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              <circle
                cx="160" cy="160" r={radius}
                fill="none"
                stroke={phase === 'work' ? 'url(#grad-work)' : 'url(#grad-break)'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
              <defs>
                <linearGradient id="grad-work" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="60%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="grad-break" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div style={styles.timerText}>
              <span style={{ ...styles.time, fontSize: '3.6rem', fontWeight: 800, letterSpacing: '2px', textShadow: '0 0 25px rgba(0, 242, 254, 0.5)' }}>
                {formatTime(timeLeft)}
              </span>
              <span style={styles.sessionLabel}>
                Session {sessionsCompleted + 1}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            {!isRunning ? (
              <button className="fm-primary-btn fm-round" onClick={handleStart}>
                <Play size={22} /> Start
              </button>
            ) : (
              <button className="fm-secondary-btn fm-round" onClick={handlePause}>
                <Pause size={22} /> Pause
              </button>
            )}
            <button className="fm-icon-btn" onClick={handleReset} title="Reset">
              <RotateCcw size={20} />
            </button>
            {isFullscreen && (
              <button className="fm-icon-btn" onClick={toggleFullscreen} title="Exit fullscreen">
                <Minimize size={20} />
              </button>
            )}
          </div>

          {/* Duration presets */}
          {!isRunning && !isFullscreen && (
            <div style={styles.presetRow}>
              {presets.map(m => (
                <button
                  key={m}
                  className={workDuration === m ? 'fm-preset active' : 'fm-preset'}
                  onClick={() => selectDuration(m)}
                >
                  {m}m
                </button>
              ))}
              <div style={styles.customDur}>
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="Custom"
                  value={customDuration}
                  onChange={e => setCustomDuration(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomDuration()}
                  style={styles.customInput}
                />
              </div>
            </div>
          )}

          {/* Settings panel (break duration) */}
          {showSettings && !isFullscreen && (
            <div style={styles.settingsPanel} className="fm-glass">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coffee size={14} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Break duration</span>
                <input
                  type="number" min="1" max="30" value={breakDuration}
                  onChange={e => setBreakDuration(Math.max(1, Math.min(30, +e.target.value)))}
                  style={{ ...styles.customInput, width: 56 }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>min</span>
              </div>
            </div>
          )}

          {/* Ambient sounds */}
          {!isFullscreen && (
            <div style={styles.ambientSection}>
              <div style={styles.ambientHeader}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>Ambient Sounds</span>
                <button
                  className="fm-icon-btn-sm"
                  onClick={() => setAmbientOn(v => !v)}
                  title={ambientOn ? 'Mute' : 'Unmute'}
                >
                  {ambientOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
              </div>
              <div style={styles.ambientBtns}>
                {ambientOptions.map(o => (
                  <button
                    key={o.key}
                    className={`fm-ambient-btn ${ambientType === o.key && ambientOn ? 'active' : ''}`}
                    onClick={() => { setAmbientType(o.key); if (!ambientOn) setAmbientOn(true); }}
                  >
                    {o.icon}
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>
              {ambientOn && ambientType !== 'silence' && (
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={ambientVolume}
                  onChange={e => setAmbientVolume(+e.target.value)}
                  style={styles.volumeSlider}
                />
              )}
            </div>
          )}
        </div>

        {/* Right — Sidebar */}
        {!isFullscreen && (
          <div style={styles.sidebar}>
            {/* Stats card */}
            <div className="fm-glass" style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Zap size={16} style={{ color: 'var(--accent-purple)' }} /> Focus Stats
              </h3>
              <div style={styles.statGrid}>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{totalFocusToday}</span>
                  <span style={styles.statLabel}>min today</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{sessionsToday + sessionsCompleted}</span>
                  <span style={styles.statLabel}>sessions</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>1</span>
                  <span style={styles.statLabel}>day streak</span>
                </div>
              </div>
            </div>

            {/* Today's sessions */}
            <div className="fm-glass" style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Sun size={16} style={{ color: 'var(--accent-blue)' }} /> Today's Sessions
              </h3>
              {todaySessions.length === 0 && sessionsCompleted === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                  No sessions yet. Start focusing!
                </p>
              ) : (
                <div style={styles.sessionList}>
                  {todaySessions.map((s, i) => (
                    <div key={s.id || i} style={styles.sessionRow}>
                      <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                        {s.focus_topic || 'Untitled'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {s.duration_minutes}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  particleCanvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3,3,8,0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 24,
    padding: '40px 48px',
    textAlign: 'center',
    maxWidth: 420,
  },
  breakGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  breakBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--card-border)',
    borderRadius: 14,
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  mainLayout: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    gap: 32,
    padding: '32px 40px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  timerArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  topBar: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  topicInput: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--card-border)',
    borderRadius: 12,
    padding: '10px 16px',
    color: 'var(--text-primary)',
    fontSize: 14,
    width: '100%',
    maxWidth: 360,
    outline: 'none',
    textAlign: 'center',
  },
  timerContainer: {
    position: 'relative',
    width: 320,
    height: 320,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    color: 'var(--text-primary)',
    fontSize: 56,
    fontWeight: 300,
    fontFamily: 'monospace',
    letterSpacing: '0.04em',
  },
  sessionLabel: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  presetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  customDur: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  customInput: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--card-border)',
    borderRadius: 8,
    padding: '6px 10px',
    color: 'var(--text-primary)',
    fontSize: 13,
    width: 72,
    outline: 'none',
  },
  settingsPanel: {
    padding: '12px 16px',
    borderRadius: 14,
    marginTop: 4,
  },
  ambientSection: {
    width: '100%',
    maxWidth: 400,
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ambientHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ambientBtns: {
    display: 'flex',
    gap: 8,
  },
  volumeSlider: {
    width: '100%',
    accentColor: 'var(--accent-purple)',
    height: 4,
  },
  sidebar: {
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flexShrink: 0,
  },
  card: {
    padding: 20,
    borderRadius: 18,
  },
  cardTitle: {
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    textAlign: 'center',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statValue: {
    color: 'var(--text-primary)',
    fontSize: 22,
    fontWeight: 600,
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontSize: 11,
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 260,
    overflowY: 'auto',
  },
  sessionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
};

// ── Scoped CSS ──────────────────────────────────────────────────────

const cssText = `
  .fm-glass {
    background: var(--card-bg);
    backdrop-filter: blur(16px);
    border: 1px solid var(--card-border);
  }

  .fm-primary-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 28px;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
    color: #fff; border: none; border-radius: 14px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s;
  }
  .fm-primary-btn:hover { opacity: 0.9; }
  .fm-primary-btn.fm-round { border-radius: 50px; padding: 12px 32px; }

  .fm-secondary-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 28px;
    background: rgba(255,255,255,0.06);
    color: var(--text-primary); border: 1px solid var(--card-border);
    border-radius: 14px; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: background 0.2s;
  }
  .fm-secondary-btn:hover { background: rgba(255,255,255,0.1); }
  .fm-secondary-btn.fm-round { border-radius: 50px; padding: 12px 32px; }

  .fm-icon-btn {
    width: 38px; height: 38px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.05); border: 1px solid var(--card-border);
    color: var(--text-secondary); cursor: pointer;
    transition: background 0.2s;
  }
  .fm-icon-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

  .fm-icon-btn-sm {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: var(--text-secondary); cursor: pointer;
  }
  .fm-icon-btn-sm:hover { color: var(--text-primary); }

  .fm-preset {
    padding: 7px 16px; border-radius: 10px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
    color: var(--text-secondary); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .fm-preset:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
  .fm-preset.active {
    background: rgba(139,92,246,0.15); border-color: var(--accent-purple);
    color: var(--accent-purple);
  }

  .fm-ambient-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 10px 4px; border-radius: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
    color: var(--text-secondary); font-size: 11px; cursor: pointer;
    transition: all 0.2s;
  }
  .fm-ambient-btn:hover { background: rgba(255,255,255,0.07); color: var(--text-primary); }
  .fm-ambient-btn.active {
    background: rgba(139,92,246,0.12); border-color: var(--accent-purple);
    color: var(--accent-purple);
  }
`;
