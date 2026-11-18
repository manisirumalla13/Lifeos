import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import {
  Sun, Moon, Sunrise, CheckCircle2, Circle, AlertTriangle,
  Clock, Plus, Star, ChevronRight, Calendar, TrendingUp, ArrowRight
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

const priorityWeight = { High: 3, Medium: 2, Low: 1 };
const sortByPriority = (a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);

function getGreeting(hour) {
  if (hour < 12) return { text: 'Good Morning', Icon: Sunrise };
  if (hour < 18) return { text: 'Good Afternoon', Icon: Sun };
  return { text: 'Good Evening', Icon: Moon };
}

function motivationalMessage(pct) {
  if (pct === 100) return "🎉 All done! You crushed it today!";
  if (pct >= 75) return "🔥 Almost there — keep the momentum!";
  if (pct >= 50) return "💪 Halfway through — you've got this!";
  if (pct >= 25) return "🚀 Great start — keep pushing forward!";
  return "🌱 Every journey starts with a single step.";
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function daysFromToday(dateStr) {
  const today = new Date(todayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// ── progress ring SVG ────────────────────────────────────────────────
function ProgressRing({ pct, size = 130, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.35))' }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="url(#ringGrad)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── main component ───────────────────────────────────────────────────
export default function MyDay({ session }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // quick-add form
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState(todayStr());
  const [addingTask, setAddingTask] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // morning priorities
  const [topPriorities, setTopPriorities] = useState([]);

  const hour = new Date().getHours();
  const { text: greetingText, Icon: GreetingIcon } = getGreeting(hour);
  const today = todayStr();
  const isEvening = hour >= 18;

  // ── fetch ────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id);
    if (!error && data) setTasks(data);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── categorize ───────────────────────────────────────────────────
  const { overdue, todayTasks, upcoming } = useMemo(() => {
    const o = [], t = [], u = [];
    for (const task of tasks) {
      const diff = daysFromToday(task.due_date);
      if (diff < 0 && !task.is_completed) o.push(task);
      else if (diff === 0) t.push(task);
      else if (diff > 0 && diff <= 3) u.push(task);
    }
    o.sort(sortByPriority);
    t.sort(sortByPriority);
    u.sort(sortByPriority);
    return { overdue: o, todayTasks: t, upcoming: u };
  }, [tasks]);

  // summary stats (today only)
  const totalToday = todayTasks.length;
  const completedToday = todayTasks.filter(t => t.is_completed).length;
  const pctToday = totalToday ? Math.round((completedToday / totalToday) * 100) : 0;

  // ── actions ──────────────────────────────────────────────────────
  const toggleTask = async (id, currentCompleted) => {
    await supabase.from('tasks').update({ is_completed: !currentCompleted }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentCompleted } : t));
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddingTask(true);
    const { error } = await supabase.from('tasks').insert([{
      user_id: session.user.id,
      title: newTitle.trim(),
      priority: newPriority,
      due_date: newDueDate || today,
      is_completed: false,
    }]);
    if (!error) {
      setNewTitle('');
      setNewPriority('Medium');
      setNewDueDate(today);
      setShowQuickAdd(false);
      await fetchTasks();
    }
    setAddingTask(false);
  };

  const togglePriority = (taskId) => {
    setTopPriorities(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : prev.length < 3 ? [...prev, taskId] : prev
    );
  };

  // pending tasks for morning planning (today, not completed)
  const pendingToday = todayTasks.filter(t => !t.is_completed);
  const doneToday = todayTasks.filter(t => t.is_completed);
  const rollingOver = [...overdue, ...pendingToday];

  // ── priority badge color ─────────────────────────────────────────
  const priorityColor = (p) => {
    if (p === 'High') return 'var(--accent-pink)';
    if (p === 'Medium') return 'var(--accent-purple)';
    return 'var(--accent-blue)';
  };

  // ── render helpers ───────────────────────────────────────────────
  const renderTask = (task, accentColor) => (
    <div key={task.id} style={{
      ...s.taskRow,
      opacity: task.is_completed ? 0.55 : 1,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <button onClick={() => toggleTask(task.id, task.is_completed)}
        style={s.checkBtn} aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}>
        {task.is_completed
          ? <CheckCircle2 size={22} color="var(--accent-emerald)" />
          : <Circle size={22} color="var(--text-secondary)" />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          ...s.taskTitle,
          textDecoration: task.is_completed ? 'line-through' : 'none',
        }}>{task.title}</span>
        <div style={s.taskMeta}>
          <span style={{ ...s.badge, background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}>
            {task.priority}
          </span>
          <span style={s.taskDate}>
            <Calendar size={12} style={{ marginRight: 4 }} />
            {task.due_date}
          </span>
        </div>
      </div>
    </div>
  );

  const renderSection = (title, icon, tasks, accent, emptyMsg) => (
    <div style={{ ...s.card, marginBottom: 20 }}>
      <div style={{ ...s.sectionHeader, color: accent }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
        <span style={s.countBadge}>{tasks.length}</span>
      </div>
      {tasks.length === 0
        ? <p style={s.emptyText}>{emptyMsg}</p>
        : <div style={s.taskList}>{tasks.map(t => renderTask(t, accent))}</div>}
    </div>
  );

  // ── JSX ──────────────────────────────────────────────────────────
  return (
    <div className="page active" style={s.page}>
      {/* ── header ─────────────────────────────────────────────── */}
      <header style={s.header}>
        <div>
          <div style={s.greetingRow}>
            <GreetingIcon size={28} color="var(--accent-purple)" />
            <h1 style={s.greeting}>{greetingText}</h1>
          </div>
          <p style={s.dateText}>{formatDate(today)}</p>
        </div>

        {/* progress ring */}
        <div style={s.ringWrap}>
          <ProgressRing pct={pctToday} />
          <div style={s.ringLabel}>
            <span style={s.ringPct}>{pctToday}%</span>
            <span style={s.ringSubText}>done</span>
          </div>
        </div>
      </header>

      {/* ── quick add toggle ───────────────────────────────────── */}
      {!showQuickAdd ? (
        <button onClick={() => setShowQuickAdd(true)} style={s.quickAddToggle}>
          <Plus size={18} /> Quick Add Task
        </button>
      ) : (
        <form onSubmit={quickAdd} style={s.quickAddForm}>
          <input style={s.input} type="text" placeholder="What needs to be done?"
            value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus required />
          <div style={s.quickAddRow}>
            <select style={s.select} value={newPriority} onChange={e => setNewPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <input style={s.input} type="date" value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)} required />
            <button type="submit" className="primary-btn" disabled={addingTask}
              style={{ ...s.addBtn, opacity: addingTask ? 0.6 : 1 }}>
              {addingTask ? '...' : <><Plus size={16} /> Add</>}
            </button>
            <button type="button" className="secondary-btn" onClick={() => setShowQuickAdd(false)}
              style={s.cancelBtn}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={s.emptyText}>Loading your day…</p>
      ) : (
        <>
          {/* ── Morning Planning (before 6 PM) ────────────────── */}
          {!isEvening && pendingToday.length > 0 && (
            <div style={{ ...s.card, marginBottom: 20, borderColor: 'rgba(139,92,246,0.25)' }}>
              <div style={s.sectionHeader}>
                <Star size={20} color="var(--accent-purple)" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Top 3 Priorities Today
                </h3>
                <span style={{ ...s.countBadge, background: 'var(--accent-purple)22' }}>
                  {topPriorities.length}/3
                </span>
              </div>
              <p style={{ ...s.emptyText, marginBottom: 12 }}>Pick up to 3 tasks to focus on today.</p>
              <div style={s.taskList}>
                {pendingToday.map(task => (
                  <div key={task.id} style={{
                    ...s.taskRow,
                    borderLeft: `3px solid ${topPriorities.includes(task.id) ? 'var(--accent-purple)' : 'transparent'}`,
                    background: topPriorities.includes(task.id) ? 'rgba(139,92,246,0.08)' : 'transparent',
                    cursor: 'pointer',
                  }} onClick={() => togglePriority(task.id)}>
                    <Star size={18}
                      fill={topPriorities.includes(task.id) ? 'var(--accent-purple)' : 'none'}
                      color={topPriorities.includes(task.id) ? 'var(--accent-purple)' : 'var(--text-secondary)'} />
                    <span style={s.taskTitle}>{task.title}</span>
                    <span style={{ ...s.badge, background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Task sections ─────────────────────────────────── */}
          {overdue.length > 0 && renderSection(
            'Overdue', <AlertTriangle size={20} />, overdue,
            '#ef4444', ''
          )}
          {renderSection(
            "Today's Focus", <Clock size={20} />, todayTasks,
            'var(--accent-purple)', 'No tasks due today — enjoy the breathing room!'
          )}
          {renderSection(
            'Upcoming (Next 3 Days)', <ChevronRight size={20} />, upcoming,
            'var(--accent-blue)', 'Nothing coming up soon.'
          )}

          {/* ── Evening Review (after 6 PM) ───────────────────── */}
          {isEvening && (
            <div style={{ ...s.card, marginBottom: 20, borderColor: 'rgba(99,102,241,0.25)' }}>
              <div style={s.sectionHeader}>
                <Moon size={20} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Evening Review</h3>
              </div>

              {doneToday.length > 0 && (
                <>
                  <h4 style={s.subHeading}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" /> Completed Today ({doneToday.length})
                  </h4>
                  <div style={s.taskList}>
                    {doneToday.map(t => (
                      <div key={t.id} style={{ ...s.taskRow, opacity: 0.75 }}>
                        <CheckCircle2 size={18} color="var(--accent-emerald)" />
                        <span style={{ ...s.taskTitle, textDecoration: 'line-through' }}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {rollingOver.length > 0 && (
                <>
                  <h4 style={{ ...s.subHeading, marginTop: 16 }}>
                    <ArrowRight size={16} color="var(--accent-pink)" /> Rolling Over ({rollingOver.length})
                  </h4>
                  <div style={s.taskList}>
                    {rollingOver.map(t => (
                      <div key={t.id} style={s.taskRow}>
                        <ArrowRight size={18} color="var(--accent-pink)" />
                        <span style={s.taskTitle}>{t.title}</span>
                        <span style={s.taskDate}>{t.due_date}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {doneToday.length === 0 && rollingOver.length === 0 && (
                <p style={s.emptyText}>No activity to review yet.</p>
              )}
            </div>
          )}

          {/* ── Daily Summary ─────────────────────────────────── */}
          <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.10))' }}>
            <div style={s.sectionHeader}>
              <TrendingUp size={20} color="var(--accent-emerald)" />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Daily Summary</h3>
            </div>
            <div style={s.summaryGrid}>
              <div style={s.statCard}>
                <span style={s.statNum}>{totalToday}</span>
                <span style={s.statLabel}>Total Today</span>
              </div>
              <div style={s.statCard}>
                <span style={{ ...s.statNum, color: 'var(--accent-emerald)' }}>{completedToday}</span>
                <span style={s.statLabel}>Completed</span>
              </div>
              <div style={s.statCard}>
                <span style={{ ...s.statNum, color: '#ef4444' }}>{overdue.length}</span>
                <span style={s.statLabel}>Overdue</span>
              </div>
            </div>
            <p style={s.motivation}>{motivationalMessage(pctToday)}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── inline styles ────────────────────────────────────────────────────
const s = {
  page: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '32px 16px 64px',
  },

  // header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 20,
  },
  greetingRow: { display: 'flex', alignItems: 'center', gap: 10 },
  greeting: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  dateText: { margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 15 },

  // progress ring
  ringWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringLabel: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'rotate(0deg)', // reset parent SVG rotation context
  },
  ringPct: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' },
  ringSubText: { fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 },

  // quick add
  quickAddToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 20px',
    marginBottom: 24,
    border: '1px dashed var(--card-border)',
    borderRadius: 14,
    background: 'rgba(139,92,246,0.06)',
    color: 'var(--text-secondary)',
    fontSize: 15,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  quickAddForm: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 16,
    background: 'var(--card-bg)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--card-border)',
  },
  quickAddRow: { display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  input: {
    flex: 1,
    minWidth: 140,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--card-border)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  },
  select: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--card-border)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  },
  addBtn: { display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' },
  cancelBtn: { whiteSpace: 'nowrap' },

  // cards / sections
  card: {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--card-border)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  countBadge: {
    marginLeft: 'auto',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-secondary)',
  },

  // task rows
  taskList: { display: 'flex', flexDirection: 'column', gap: 8 },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.02)',
    transition: 'background 0.15s',
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
  },
  taskTitle: { color: 'var(--text-primary)', fontSize: 15, fontWeight: 500 },
  taskMeta: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 },
  badge: {
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskDate: { display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' },

  // summary
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 8px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
  },
  statNum: { fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' },
  statLabel: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 },
  motivation: {
    textAlign: 'center',
    fontSize: 15,
    color: 'var(--text-secondary)',
    margin: 0,
    padding: '8px 0 0',
  },

  // misc
  emptyText: { color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 0' },
  subHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    margin: '12px 0 8px',
  },
};
