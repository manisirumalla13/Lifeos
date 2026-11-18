import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  getReminders,
  saveReminders,
  getNotificationHistory,
  logNotificationHistory,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../services/reminderService';
import {
  Bell,
  Plus,
  Clock,
  RotateCcw,
  CheckCircle,
  Trash2,
  Calendar,
  AlertCircle,
  Repeat,
  History,
  Volume2,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function Reminders({ session }) {
  const userId = session?.user?.id;
  const [reminders, setReminders] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Task');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [repeat, setRepeat] = useState('none'); // none, daily, weekly
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  useEffect(() => {
    if (!userId) return;
    const loadedReminders = getReminders(userId);
    setReminders(loadedReminders);
    setHistory(getNotificationHistory(userId));

    // Also auto-suggest reminders from tasks with upcoming due dates if empty
    if (loadedReminders.length === 0) {
      loadTaskDeadlines(userId);
    }
  }, [userId]);

  // Periodic reminder checking loop
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      checkReminders();
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, [reminders, userId]);

  const loadTaskDeadlines = async (uid) => {
    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', uid)
        .eq('is_completed', false);

      if (tasks && tasks.length > 0) {
        const auto = tasks.slice(0, 3).map((t) => ({
          id: 'task_' + t.id,
          title: `Due: ${t.title}`,
          category: 'Task Deadline',
          date: t.due_date || new Date().toISOString().split('T')[0],
          time: '09:00',
          repeat: 'none',
          status: 'pending',
          createdAt: new Date().toISOString(),
        }));
        setReminders(auto);
        saveReminders(uid, auto);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const checkReminders = () => {
    const now = new Date();
    let updated = false;
    const nextReminders = reminders.map((r) => {
      if (r.status !== 'pending') return r;

      const target = new Date(`${r.date}T${r.time}`);
      if (now >= target) {
        // Trigger notification
        sendBrowserNotification(r.title, {
          body: `LifeOS Reminder [${r.category}]`,
        });

        logNotificationHistory(userId, {
          title: r.title,
          category: r.category,
        });
        setHistory(getNotificationHistory(userId));
        updated = true;

        if (r.repeat === 'daily') {
          const nextDay = new Date(target);
          nextDay.setDate(nextDay.getDate() + 1);
          return { ...r, date: nextDay.toISOString().split('T')[0] };
        } else if (r.repeat === 'weekly') {
          const nextWeek = new Date(target);
          nextWeek.setDate(nextWeek.getDate() + 7);
          return { ...r, date: nextWeek.toISOString().split('T')[0] };
        } else {
          return { ...r, status: 'completed' };
        }
      }
      return r;
    });

    if (updated) {
      setReminders(nextReminders);
      saveReminders(userId, nextReminders);
    }
  };

  const handleAskPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  const handleCreateReminder = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      date,
      time,
      repeat,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [newReminder, ...reminders];
    setReminders(updated);
    saveReminders(userId, updated);
    setTitle('');
  };

  const handleSnooze = (id, minutes) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    const cur = new Date(`${target.date}T${target.time}`);
    cur.setMinutes(cur.getMinutes() + minutes);

    const pad = (n) => String(n).padStart(2, '0');
    const newDate = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    const newTime = `${pad(cur.getHours())}:${pad(cur.getMinutes())}`;

    const updated = reminders.map((r) =>
      r.id === id ? { ...r, date: newDate, time: newTime, status: 'pending' } : r
    );
    setReminders(updated);
    saveReminders(userId, updated);
  };

  const handleDelete = (id) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(userId, updated);
  };

  const handleComplete = (id) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: 'completed' } : r
    );
    setReminders(updated);
    saveReminders(userId, updated);
  };

  const handleTestNotification = () => {
    sendBrowserNotification('LifeOS Test Alert', {
      body: 'Your smart notification system is fully operational!',
    });
    logNotificationHistory(userId, {
      title: 'LifeOS Test Alert',
      category: 'System Diagnostic',
    });
    setHistory(getNotificationHistory(userId));
  };

  const activeReminders = reminders.filter((r) => r.status === 'pending');
  const pastReminders = reminders.filter((r) => r.status === 'completed');

  return (
    <div className="page active" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Top Title Bar with Window Dots */}
      <div className="card glass" style={{ marginBottom: 20, padding: '16px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: '#00f2fe' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                Smart Reminders // Telemetry Notifications
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {notifPermission !== 'granted' ? (
              <button
                onClick={handleAskPermission}
                className="primary-btn"
                style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'linear-gradient(135deg, #00f2fe, #a855f7)' }}
              >
                <Volume2 size={16} /> Enable Browser Push
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
                <Check size={14} /> Push Notifications Active
              </div>
            )}

            <button
              onClick={handleTestNotification}
              className="secondary-btn"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              Test Alert
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Form on Left, Active Reminders & History on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 25, alignItems: 'start' }}>
        {/* Create Reminder Card */}
        <div className="card glass">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="var(--accent-purple)" /> Create Reminder
          </h3>

          <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Reminder Title
              </label>
              <input
                type="text"
                placeholder="e.g. Submit CS301 Assignment or Take evening walk"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--card-border)',
                    color: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="Task">Task Deadline</option>
                  <option value="Habit">Habit Routine</option>
                  <option value="Study">Study Immersion</option>
                  <option value="Goal">Goal Milestone</option>
                  <option value="Wellness">Wellness Check</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Repeat Rule
                </label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--card-border)',
                    color: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="none">Once (No repeat)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--card-border)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--card-border)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" style={{ justifyContent: 'center', marginTop: 10 }}>
              <Plus size={18} /> Schedule Reminder
            </button>
          </form>
        </div>

        {/* Right Section: Active Reminders / History Tabs */}
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                background: activeTab === 'active' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border: activeTab === 'active' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                color: activeTab === 'active' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                padding: '8px 18px',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Bell size={16} /> Active ({activeReminders.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border: activeTab === 'history' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                color: activeTab === 'history' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                padding: '8px 18px',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <History size={16} /> Alert History ({history.length})
            </button>
          </div>

          {activeTab === 'active' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeReminders.length === 0 ? (
                <div className="card glass" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <Bell size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No active reminders scheduled. Set one up on the left!</p>
                </div>
              ) : (
                activeReminders.map((r) => (
                  <div
                    key={r.id}
                    className="glass"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderRadius: 16,
                      borderLeft: '4px solid var(--accent-purple)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{r.title}</h4>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: 'var(--accent-purple)',
                          }}
                        >
                          {r.category}
                        </span>
                        {r.repeat !== 'none' && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: 12,
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--accent-blue)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Repeat size={10} /> {r.repeat}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 15, marginTop: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} /> {r.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} /> {r.time}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Snooze options */}
                      <button
                        onClick={() => handleSnooze(r.id, 10)}
                        className="secondary-btn"
                        title="Snooze 10 minutes"
                        style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      >
                        +10m
                      </button>
                      <button
                        onClick={() => handleSnooze(r.id, 60)}
                        className="secondary-btn"
                        title="Snooze 1 hour"
                        style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      >
                        +1h
                      </button>

                      {/* Complete */}
                      <button
                        onClick={() => handleComplete(r.id)}
                        className="secondary-btn"
                        title="Mark Done"
                        style={{ padding: '6px 10px', color: 'var(--accent-emerald)' }}
                      >
                        <Check size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="secondary-btn danger"
                        title="Delete Reminder"
                        style={{ padding: '6px 10px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.length === 0 ? (
                <div className="card glass" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <History size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No notifications triggered yet.</p>
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="glass"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 18px',
                      borderRadius: 14,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{h.title}</span>
                      <span style={{ marginLeft: 10, fontSize: '0.75rem', color: 'var(--accent-blue)' }}>[{h.category}]</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(h.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(h.triggeredAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

