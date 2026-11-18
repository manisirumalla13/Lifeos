import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import GrowthTree from '../components/3d/GrowthTree';
import { Activity, Flame, Plus, Check, Award, Sparkles, TrendingUp, Calendar } from 'lucide-react';

export default function Habits({ session }) {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchHabits();
  }, [session]);

  const fetchHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*, habit_completions(*)')
      .eq('user_id', session.user.id);
    if (data) setHabits(data);
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await supabase.from('habits').insert([{ user_id: session.user.id, title: title.trim(), schedule: 'daily' }]);
    setTitle('');
    fetchHabits();
  };

  const completeHabit = async (habitId, completions) => {
    const alreadyDone = completions && completions.some((c) => c.completed_date === today);
    if (alreadyDone) return;
    await supabase.from('habit_completions').insert([{ habit_id: habitId, completed_date: today }]);
    fetchHabits();
  };

  const totalCompletions = habits.reduce((acc, h) => acc + (h.habit_completions?.length || 0), 0);
  const avgMaturity = habits.length > 0 ? Math.min(100, Math.round((totalCompletions / (habits.length * 10)) * 100)) : 45;

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
            LifeOS // Habit Continuity Tracker
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge" style={{ borderColor: 'rgba(0, 242, 254, 0.4)', color: 'var(--accent-cyan)' }}>
            <Flame size={13} /> {totalCompletions} Executions Logged
          </span>
        </div>
      </div>

      {/* Main Grid: Left Matrix + Right 3D Growth Tree */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 25 }}>
        {/* Left: Matrix Card */}
        <div className="card glass">
          <div className="window-header">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span className="window-title">Consistency Matrix</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Live Telemetry</span>
          </div>

          <form onSubmit={addHabit} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Deploy new habit routine (e.g. Read 20 mins, Hydrate 2L)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
            <button type="submit" className="primary-btn" style={{ padding: '8px 18px' }}>
              <Plus size={16} /> Deploy Habit
            </button>
          </form>

          {/* Matrix Dot Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {habits.map((h) => {
              const completions = h.habit_completions || [];
              const doneToday = completions.some((c) => c.completed_date === today);

              return (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--card-border)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 150 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{h.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {completions.length} total check-ins
                    </div>
                  </div>

                  {/* Matrix Glowing Dot Grid (Last 14 days) */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {Array.from({ length: 14 }).map((_, i) => {
                      const isComplete = i < Math.min(14, completions.length || (i % 3 === 0 ? 1 : 0));
                      const colors = ['#00f2fe', '#a855f7', '#ec4899', '#10b981'];
                      const dotColor = colors[i % colors.length];

                      return (
                        <div
                          key={i}
                          title={`Day ${i + 1}`}
                          style={{
                            width: 13,
                            height: 13,
                            borderRadius: 4,
                            background: isComplete ? dotColor : 'rgba(255, 255, 255, 0.08)',
                            boxShadow: isComplete ? `0 0 8px ${dotColor}` : 'none',
                            transition: 'all 0.2s',
                          }}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={() => completeHabit(h.id, h.habit_completions)}
                    disabled={doneToday}
                    className={doneToday ? 'secondary-btn' : 'primary-btn'}
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      opacity: doneToday ? 0.7 : 1,
                    }}
                  >
                    {doneToday ? '✓ Done Today' : 'Complete'}
                  </button>
                </div>
              );
            })}

            {habits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)' }}>
                No active habits deployed. Add your first routine above!
              </div>
            )}
          </div>
        </div>

        {/* Right: 3D Holographic Growth Tree */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="window-header" style={{ width: 'calc(100% + 48px)' }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span className="window-title">Neural Growth Tree</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{avgMaturity}% Maturity</span>
          </div>

          <div style={{ width: '100%', height: 210, position: 'relative' }}>
            <GrowthTree progress={avgMaturity} />
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Habit Forest Ecosystem</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Consistent daily executions feed the neural growth tree.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
