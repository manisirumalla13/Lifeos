import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  BookOpen,
  Activity,
  Plus,
  AlertTriangle,
  Download,
  CalendarDays,
} from 'lucide-react';

export default function CalendarView({ session }) {
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [habits, setHabits] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('14:00');

  useEffect(() => {
    fetchEvents();
    loadCustomEvents();
  }, [session]);

  const loadCustomEvents = () => {
    try {
      const raw = localStorage.getItem('lifeos_custom_events_' + session.user.id);
      if (raw) setCustomEvents(JSON.parse(raw));
    } catch (_) {}
  };

  const saveCustomEvents = (events) => {
    setCustomEvents(events);
    localStorage.setItem('lifeos_custom_events_' + session.user.id, JSON.stringify(events));
  };

  const fetchEvents = async () => {
    try {
      const uid = session.user.id;
      const [{ data: t }, { data: s }, { data: h }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('study_sessions').select('*').eq('user_id', uid),
        supabase.from('habits').select('*').eq('user_id', uid),
      ]);
      setTasks(t || []);
      setStudySessions(s || []);
      setHabits(h || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Compile all calendar items
  const allEvents = [
    ...tasks.map((t) => ({
      id: 'task_' + t.id,
      title: `Task: ${t.title}`,
      date: t.due_date,
      time: '09:00',
      type: 'task',
      priority: t.priority,
      color: '#8b5cf6',
    })),
    ...studySessions.map((s) => ({
      id: 'study_' + s.id,
      title: `Study: ${s.subject || 'Session'} (${s.duration_minutes}m)`,
      date: s.start_time ? s.start_time.split('T')[0] : '',
      time: s.start_time ? s.start_time.split('T')[1]?.slice(0, 5) || '10:00' : '10:00',
      type: 'study',
      color: '#3b82f6',
    })),
    ...customEvents.map((c) => ({
      ...c,
      color: '#ec4899',
    })),
  ];

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'month') next.setMonth(next.getMonth() - 1);
    else if (view === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'month') next.setMonth(next.getMonth() + 1);
    else if (view === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const ev = {
      id: 'custom_' + Date.now(),
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      type: 'custom',
    };

    saveCustomEvents([ev, ...customEvents]);
    setNewTitle('');
    setShowAddModal(false);
  };

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Export iCal .ics
  const exportICS = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LifeOS//Calendar//EN\n";
    allEvents.forEach((ev) => {
      if (!ev.date) return;
      const cleanDate = ev.date.replace(/-/g, '');
      ics += "BEGIN:VEVENT\n";
      ics += `SUMMARY:${ev.title}\n`;
      ics += `DTSTART:${cleanDate}T090000Z\n`;
      ics += `DTEND:${cleanDate}T100000Z\n`;
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `LifeOS_Calendar_${monthNames[month]}_${year}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={18} style={{ color: '#00f2fe' }} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                  Calendar // Temporal Horizon
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
              {['month', 'week', 'day'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: view === v ? 'linear-gradient(135deg, #00f2fe, #a855f7)' : 'transparent',
                    color: view === v ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="primary-btn"
              style={{ fontSize: '0.85rem', padding: '8px 14px', background: 'linear-gradient(135deg, #00f2fe, #a855f7)' }}
            >
              <Plus size={16} /> Add Event
            </button>

            <button
              onClick={exportICS}
              className="secondary-btn"
              title="Export iCalendar (.ics)"
              style={{ padding: '8px 12px' }}
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handlePrev} className="secondary-btn" style={{ padding: '6px 10px' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleToday} className="secondary-btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            Today
          </button>
          <button onClick={handleNext} className="secondary-btn" style={{ padding: '6px 10px' }}>
            <ChevronRight size={16} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, marginLeft: 10 }}>
            {monthNames[month]} {year}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 15, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#8b5cf6' }}></span> Tasks
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#3b82f6' }}></span> Study
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#ec4899' }}></span> Events
          </span>
        </div>
      </div>

      {/* Month View Grid */}
      {view === 'month' && (
        <div className="card glass" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {/* Empty offset padding cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty_${i}`} style={{ minHeight: 90, opacity: 0.2 }} />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const pad = (n) => String(n).padStart(2, '0');
              const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              const dayEvents = allEvents.filter((ev) => ev.date === dateStr);

              return (
                <div
                  key={dateStr}
                  style={{
                    minHeight: 100,
                    background: isToday ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: isToday ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.07)',
                    boxShadow: isToday ? '0 0 15px rgba(0, 242, 254, 0.2)' : 'none',
                    borderRadius: 12,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isToday ? '#00f2fe' : '#fff' }}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        {dayEvents.length} items
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', maxHeight: 75 }}>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          background: `${ev.color}22`,
                          borderLeft: `3px solid ${ev.color}`,
                          padding: '3px 6px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day View */}
      {(view === 'week' || view === 'day') && (
        <div className="card glass">
          <h3 style={{ marginBottom: 15 }}>Timeline Agenda</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allEvents
              .filter((ev) => ev.date)
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 15)
              .map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.03)',
                    borderLeft: `4px solid ${ev.color}`,
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem' }}>{ev.title}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Date: {ev.date} {ev.time && `• ${ev.time}`}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: 10,
                      background: `${ev.color}22`,
                      color: ev.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {ev.type}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Custom Event Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="glass"
            style={{
              width: 420,
              maxWidth: '92%',
              padding: 26,
              borderRadius: 20,
              background: 'rgba(18, 22, 36, 0.95)',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 16 }}>Schedule New Calendar Event</h3>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text"
                placeholder="Event name (e.g. Project Sprint Sync)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
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
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="secondary-btn"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ padding: '8px 20px' }}
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

