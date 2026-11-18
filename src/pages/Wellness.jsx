import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Droplet,
  Moon,
  Dumbbell,
  Smile,
  BookOpen,
  Plus,
  Minus,
  TrendingUp,
  Check,
  Calendar,
} from 'lucide-react';

const WELLNESS_KEY = 'lifeos_wellness_';

export default function Wellness({ session }) {
  const userId = session?.user?.id;
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [waterGlasses, setWaterGlasses] = useState(4); // 250ml per glass
  const [sleepHours, setSleepHours] = useState(7.5);
  const [mood, setMood] = useState('Focused'); // 'Energetic' | 'Calm' | 'Focused' | 'Tired' | 'Stressed'
  const [exerciseMinutes, setExerciseMinutes] = useState(30);
  const [exerciseType, setExerciseType] = useState('Walking / Cardio');
  const [reflection, setReflection] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState([]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(WELLNESS_KEY + userId);
      if (raw) {
        const parsed = JSON.parse(raw);
        setWeeklyHistory(parsed);
        const todayData = parsed.find((p) => p.date === date);
        if (todayData) {
          setWaterGlasses(todayData.waterGlasses || 0);
          setSleepHours(todayData.sleepHours || 7);
          setMood(todayData.mood || 'Focused');
          setExerciseMinutes(todayData.exerciseMinutes || 0);
          setExerciseType(todayData.exerciseType || 'Walking');
          setReflection(todayData.reflection || '');
        }
      }
    } catch (_) {}
  }, [userId, date]);

  const handleSave = (e) => {
    e.preventDefault();
    const entry = {
      date,
      waterGlasses,
      sleepHours,
      mood,
      exerciseMinutes,
      exerciseType,
      reflection,
      updatedAt: new Date().toISOString(),
    };

    const existing = weeklyHistory.filter((h) => h.date !== date);
    const updated = [entry, ...existing].slice(0, 30);
    setWeeklyHistory(updated);
    localStorage.setItem(WELLNESS_KEY + userId, JSON.stringify(updated));

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const moods = [
    { label: 'Energetic', emoji: '⚡', color: '#f59e0b' },
    { label: 'Focused', emoji: '🎯', color: '#8b5cf6' },
    { label: 'Calm', emoji: '🌿', color: '#10b981' },
    { label: 'Tired', emoji: '🥱', color: '#3b82f6' },
    { label: 'Stressed', emoji: '🌪️', color: '#ef4444' },
  ];

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
            LifeOS // Vitality & Biological Telemetry
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none',
              fontSize: '0.82rem',
            }}
          />
          {savedNotice && (
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: 8 }}>
              ✓ Saved!
            </span>
          )}
        </div>
      </div>

      {/* Glowing EKG Pulse Waveform */}
      <div className="card glass" style={{ marginBottom: 24, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartPulse size={18} color="#ec4899" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>Biological Pulse Waveform</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Rhythm: Normal Sinus</span>
        </div>
        <svg width="100%" height="50" viewBox="0 0 600 50" style={{ filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))' }}>
          <path
            d="M0,25 L100,25 L115,8 L130,42 L145,15 L160,30 L175,25 L280,25 L295,6 L310,44 L325,12 L340,32 L355,25 L460,25 L475,8 L490,40 L505,18 L520,28 L535,25 L600,25"
            fill="none"
            stroke="url(#ekgGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="ekgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <form onSubmit={handleSave}>
        {/* Core Tracker Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 25 }}>
          {/* Hydration */}
          <div className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Droplet size={20} color="#06b6d4" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Hydration</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 700 }}>
                {waterGlasses * 250} ml / 2000 ml
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, margin: '20px 0' }}>
              <button
                type="button"
                onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                className="secondary-btn"
                style={{ padding: '8px 14px', borderRadius: 12 }}
              >
                <Minus size={18} />
              </button>
              <span style={{ fontSize: '2.4rem', fontWeight: 800 }}>{waterGlasses}</span>
              <button
                type="button"
                onClick={() => setWaterGlasses(waterGlasses + 1)}
                className="secondary-btn"
                style={{ padding: '8px 14px', borderRadius: 12 }}
              >
                <Plus size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background: i < waterGlasses ? '#06b6d4' : 'rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sleep Recovery */}
          <div className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Moon size={20} color="#8b5cf6" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Sleep Rest</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
                {sleepHours} Hours
              </span>
            </div>

            <div style={{ margin: '25px 0' }}>
              <input
                type="range"
                min="0"
                max="14"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                <span>4h</span>
                <span>7-8h (Target)</span>
                <span>12h</span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
              {sleepHours >= 7 && sleepHours <= 9
                ? '🌟 Optimal cognitive regeneration achieved.'
                : sleepHours < 7
                ? '⚠️ Consider a 20-minute power recharge today.'
                : '😴 Heavy rest cycle.'}
            </p>
          </div>

          {/* Movement & Exercise */}
          <div className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Dumbbell size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Movement</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {exerciseMinutes} mins
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '15px 0' }}>
              <input
                type="number"
                min="0"
                step="5"
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(parseInt(e.target.value) || 0)}
                placeholder="Duration (minutes)"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                placeholder="Activity (e.g. Yoga, Jogging, Gym)"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Emotional Resonance / Mood */}
          <div className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smile size={20} color="#ec4899" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Mindset & State</h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', margin: '20px 0' }}>
              {moods.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMood(m.label)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 4px',
                    borderRadius: 12,
                    border: mood === m.label ? `2px solid ${m.color}` : '1px solid var(--card-border)',
                    background: mood === m.label ? `${m.color}22` : 'rgba(0,0,0,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{m.emoji}</span>
                  <span style={{ fontSize: '0.68rem', color: mood === m.label ? m.color : 'var(--text-secondary)' }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection & Log Entry */}
        <div className="card glass" style={{ marginBottom: 25 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color="var(--accent-purple)" /> Daily Cognitive Reflection
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
            What was your main insight, gratitude, or point of friction today?
          </p>

          <textarea
            rows="4"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write your reflections here..."
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none',
              resize: 'vertical',
              fontSize: '0.92rem',
              lineHeight: 1.6,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button type="submit" className="primary-btn" style={{ padding: '10px 24px' }}>
              <Check size={18} /> Save Vitality Log
            </button>
          </div>
        </div>
      </form>

      {/* Non-medical disclaimer */}
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
        Disclaimer: LifeOS Vitality tracker is an observational self-reflection tool, not medical or clinical advice.
      </p>
    </div>
  );
}

