import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import GrowthTree from '../components/3d/GrowthTree';
import { Target, Calendar, TrendingUp, Plus, Flag, Sparkles, CheckCircle2, ChevronRight, Award, Zap } from 'lucide-react';

export default function Goals({ session }) {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Career');
  const [progress, setProgress] = useState(25);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, [session]);

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*').eq('user_id', session.user.id);
    if (data && data.length > 0) {
      setGoals(data);
      if (!selectedGoal) setSelectedGoal(data[0]);
    } else {
      setGoals([]);
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    const newGoal = {
      user_id: session.user.id,
      title,
      target_date: targetDate,
      current_progress: progress,
    };
    const { data, error } = await supabase.from('goals').insert([newGoal]).select();
    if (!error && data) {
      const created = data[0];
      setGoals(prev => [...prev, created]);
      setSelectedGoal(created);
    } else {
      fetchGoals();
    }
    setTitle('');
    setTargetDate('');
    setProgress(25);
  };

  const updateGoalProgress = async (id, newProgress) => {
    const clamped = Math.min(100, Math.max(0, newProgress));
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current_progress: clamped } : g));
    if (selectedGoal?.id === id) {
      setSelectedGoal(prev => ({ ...prev, current_progress: clamped }));
    }
    await supabase.from('goals').update({ current_progress: clamped }).eq('id', id);
  };

  const activeGoal = selectedGoal || goals[0] || null;

  return (
    <div className="page active" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Top Title Bar with Window Dots */}
      <div className="card glass" style={{ marginBottom: 20, padding: '16px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flag size={18} style={{ color: '#00f2fe' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                Life Timeline // Growth Objectives
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#00f2fe', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
            {goals.length} ACTIVE MILESTONES
          </span>
        </div>
      </div>

      {/* Cyber Life Timeline Horizontal Node Roadmap (Mockup Model) */}
      <div className="card glass" style={{ marginBottom: 24, padding: '24px', overflowX: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} style={{ color: '#ec4899' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Life Trajectory Roadmap</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click milestone node to inspect</span>
        </div>

        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Target size={42} style={{ color: '#00f2fe', opacity: 0.5, marginBottom: 10 }} />
            <p>No trajectory milestones plotted. Construct your first objective below.</p>
          </div>
        ) : (
          <div style={{ minWidth: 620, padding: '20px 10px 10px' }}>
            {/* The horizontal luminous interconnect wire */}
            <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '40px 30px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(90deg, #00f2fe 0%, #a855f7 50%, #ec4899 100%)',
                  boxShadow: '0 0 16px rgba(0,242,254,0.6)',
                  borderRadius: 2
                }}
              />

              {/* Plotted Milestone Nodes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', width: '100%', top: -20, left: 0 }}>
                {goals.map((g, idx) => {
                  const isSelected = activeGoal?.id === g.id;
                  const isDone = g.current_progress >= 100;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGoal(g)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.25s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Node Icon Circle */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isSelected
                            ? 'linear-gradient(135deg, #00f2fe, #a855f7)'
                            : 'rgba(15, 23, 42, 0.9)',
                          border: isSelected
                            ? '2px solid #fff'
                            : isDone
                            ? '2px solid #10b981'
                            : '2px solid rgba(0, 242, 254, 0.5)',
                          boxShadow: isSelected
                            ? '0 0 20px #00f2fe, inset 0 0 10px rgba(255,255,255,0.5)'
                            : isDone
                            ? '0 0 12px rgba(16,185,129,0.5)'
                            : '0 0 8px rgba(0,242,254,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={20} color="#fff" /> : `${g.current_progress}%`}
                      </div>

                      {/* Node Label Below */}
                      <div style={{ textAlign: 'center', marginTop: 12, maxWidth: 110 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: isSelected ? '#00f2fe' : '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {g.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {g.target_date || 'Ongoing'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Selected Goal Inspector + 3D Growth Visualizer & Construction Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Active Milestone Card with 3D GrowthTree */}
        {activeGoal && (
          <div className="card glass" style={{ border: '1px solid rgba(0,242,254,0.3)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="window-dots">
                <span className="window-dot red" />
                <span className="window-dot yellow" />
                <span className="window-dot green" />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>
                HOLOGRAM SIMULATOR
              </span>
            </div>

            <div style={{ height: 210, width: '100%', borderRadius: 14, overflow: 'hidden', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(5,7,14,0.8) 100%)', marginBottom: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <GrowthTree progress={activeGoal.current_progress} />
            </div>

            <div style={{ padding: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{activeGoal.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <Calendar size={13} style={{ color: '#00f2fe' }} />
                    <span>Target: {activeGoal.target_date || 'No deadline'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00f2fe', textShadow: '0 0 12px rgba(0,242,254,0.6)' }}>
                    {activeGoal.current_progress}%
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MATURITY</div>
                </div>
              </div>

              {/* Progress Slider & Quick Bump Buttons */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
                  <span>Ecosystem Growth Status</span>
                  <span>{activeGoal.current_progress >= 100 ? 'Fully Manifested' : 'Growing...'}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${activeGoal.current_progress}%`,
                      background: 'linear-gradient(90deg, #00f2fe, #a855f7)',
                      boxShadow: '0 0 10px #00f2fe',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => updateGoalProgress(activeGoal.id, activeGoal.current_progress - 10)}
                    className="secondary-btn"
                    style={{ flex: 1, padding: '7px 0', fontSize: '0.8rem' }}
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => updateGoalProgress(activeGoal.id, activeGoal.current_progress + 10)}
                    className="secondary-btn"
                    style={{ flex: 1, padding: '7px 0', fontSize: '0.8rem' }}
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => updateGoalProgress(activeGoal.id, 100)}
                    className="primary-btn"
                    style={{ flex: 2, padding: '7px 0', fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981, #00f2fe)' }}
                  >
                    <CheckCircle2 size={15} /> Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Construction Form */}
        <div className="card glass" style={{ border: '1px solid rgba(168,85,247,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 700 }}>
              CONSTRUCT MILESTONE
            </span>
          </div>

          <form onSubmit={addGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                OBJECTIVE TITLE
              </label>
              <input
                type="text"
                placeholder="e.g. Master Three.js Shader Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  TARGET DEADLINE
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0d1322',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="Career">Career & Mastery</option>
                  <option value="Health">Health & Vitality</option>
                  <option value="Finances">Financial Freedom</option>
                  <option value="Creative">Creative Output</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>INITIAL MATURITY</span>
                <span style={{ color: '#00f2fe', fontWeight: 700 }}>{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00f2fe' }}
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              style={{
                marginTop: 6,
                padding: '12px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              <Plus size={18} /> Plot Onto Timeline
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
