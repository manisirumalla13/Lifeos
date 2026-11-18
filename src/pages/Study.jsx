import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import TimeClock from '../components/3d/TimeClock';
import { Play, RotateCcw, Book, History, Clock } from 'lucide-react';

export default function Study({ session }) {
  const [subject, setSubject] = useState('');
  // Explicitly allow user to set duration
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Update timer when duration changes, but only if not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isActive]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      sendNotification();
      logSession();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const sendNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("LifeOS Study Alert", {
        body: `Your study session for "${subject || 'your subject'}" is complete!`,
      });
    }
  };

  const fetchSessions = async () => {
    const { data } = await supabase.from('study_sessions').select('*').eq('user_id', session.user.id).order('start_time', { ascending: false });
    if (data) setSessions(data);
  };

  const logSession = async () => {
    if (!subject) return;
    await supabase.from('study_sessions').insert([{ user_id: session.user.id, subject, duration_minutes: duration }]);
    fetchSessions();
  };

  const startTimer = () => {
    if (subject) setIsActive(!isActive);
    else alert('Establish a subject focus first.');
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
            LifeOS // Temporal Study Tracker
          </span>
        </div>
      </div>

      <div className="study-grid-premium">
        <div className="card glass timer-card">
          <div className="input-group">
            <Book size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Focal Subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="input-group" style={{marginTop: '10px'}}>
             <Clock size={18} className="input-icon" />
             <input
                type="number"
                value={duration}
                min="1"
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="Duration (minutes)"
             />
          </div>

          <div className="timer-visualization">
            <TimeClock isRunning={isActive} />
            <div className="timer-digital">{formatTime(timeLeft)}</div>
          </div>

          <div className="pomodoro-controls">
            <button className={`primary-btn ${isActive ? 'active' : ''}`} onClick={startTimer}>
              <Play size={18} /> {isActive ? 'Running' : 'Initialize'}
            </button>
            <button className="secondary-btn" onClick={resetTimer}>
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </div>

        <div className="card glass log-card">
          <div className="card-header">
             <History size={20} />
             <h3>Session Archive</h3>
          </div>
          <div className="session-list">
            {sessions.length === 0 ? (
              <p className="empty-state">No historical data found.</p>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="session-entry">
                  <div className="session-info">
                    <span className="session-subject">{s.subject}</span>
                    <span className="session-date">{new Date(s.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="session-duration">{s.duration_minutes}m</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
