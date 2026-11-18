import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  Award,
  Zap,
  Target,
  Flame,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Shield,
  Crown,
} from 'lucide-react';

export default function Achievements({ session }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    studyMinutes: 0,
    goalsCompleted: 0,
    habitsCompleted: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [session]);

  const fetchStats = async () => {
    try {
      const uid = session.user.id;
      const [{ data: tasks }, { data: study }, { data: goals }, { data: habits }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('study_sessions').select('*').eq('user_id', uid),
        supabase.from('goals').select('*').eq('user_id', uid),
        supabase.from('habits').select('*, habit_completions(*)').eq('user_id', uid),
      ]);

      const doneTasks = tasks ? tasks.filter((t) => t.is_completed).length : 0;
      const studyMins = study ? study.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) : 0;
      const doneGoals = goals ? goals.filter((g) => g.current_progress >= 100).length : 0;
      const habitTicks = habits ? habits.reduce((sum, h) => sum + (h.habit_completions?.length || 0), 0) : 0;

      setStats({
        tasksCompleted: doneTasks,
        studyMinutes: studyMins,
        goalsCompleted: doneGoals,
        habitsCompleted: habitTicks,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // XP calculation
  const xp = stats.tasksCompleted * 50 + stats.studyMinutes * 5 + stats.goalsCompleted * 300 + stats.habitsCompleted * 30;
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXP = xp % 500;
  const levelProgressPct = Math.round((currentLevelXP / 500) * 100);

  // Badge list with live unlock conditions
  const badges = [
    {
      id: 'first_task',
      name: 'Initiator',
      desc: 'Complete your first task in LifeOS',
      unlocked: stats.tasksCompleted >= 1,
      icon: CheckCircle2,
      tier: 'Bronze',
      color: '#3b82f6',
    },
    {
      id: 'task_10',
      name: 'Momentum Builder',
      desc: 'Complete 10 tasks across your workspace',
      unlocked: stats.tasksCompleted >= 10,
      icon: Zap,
      tier: 'Silver',
      color: '#8b5cf6',
    },
    {
      id: 'task_50',
      name: 'Centurion of Focus',
      desc: 'Complete 50 tasks with discipline',
      unlocked: stats.tasksCompleted >= 50,
      icon: Crown,
      tier: 'Gold',
      color: '#f59e0b',
    },
    {
      id: 'study_1h',
      name: 'Deep Diver',
      desc: 'Log at least 60 minutes of study focus',
      unlocked: stats.studyMinutes >= 60,
      icon: Clock,
      tier: 'Bronze',
      color: '#10b981',
    },
    {
      id: 'study_5h',
      name: 'Scholar of the Realm',
      desc: 'Accumulate 300 minutes of pure immersion',
      unlocked: stats.studyMinutes >= 300,
      icon: Star,
      tier: 'Silver',
      color: '#06b6d4',
    },
    {
      id: 'habit_1',
      name: 'Routine Architect',
      desc: 'Execute your first daily habit reflection',
      unlocked: stats.habitsCompleted >= 1,
      icon: Flame,
      tier: 'Bronze',
      color: '#ec4899',
    },
    {
      id: 'goal_1',
      name: 'Apex Achiever',
      desc: 'Reach 100% completion on any life goal',
      unlocked: stats.goalsCompleted >= 1,
      icon: Trophy,
      tier: 'Gold',
      color: '#e11d48',
    },
    {
      id: 'mastery',
      name: 'LifeOS Sovereign',
      desc: 'Reach Level 5 in total productivity mastery',
      unlocked: level >= 5,
      icon: Award,
      tier: 'Platinum',
      color: '#8b5cf6',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

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
              <Trophy size={18} style={{ color: '#00f2fe' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                Mastery // Neural Achievements
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#00f2fe', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
            {unlockedCount} / {badges.length} UNLOCKED
          </span>
        </div>
      </div>

      {/* Level & XP Banner Card */}
      <div
        className="glass"
        style={{
          padding: '28px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          marginBottom: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'var(--gradient-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.4rem',
                color: '#fff',
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              {level}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Level {level} Architect</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {xp.toLocaleString()} Total Productivity Energy (XP)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
              {currentLevelXP} / 500 XP to Level {level + 1}
            </span>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${levelProgressPct}%`,
              height: '100%',
              background: 'var(--gradient-glow)',
              borderRadius: 6,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span>✓ {stats.tasksCompleted} Tasks finished</span>
          <span>⏱️ {stats.studyMinutes}m Immersion logged</span>
          <span>🌿 {stats.habitsCompleted} Habits reinforced</span>
          <span>🏆 {stats.goalsCompleted} Goals crowned</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          Honor Medals ({unlockedCount}/{badges.length} Unlocked)
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              className="glass"
              style={{
                padding: '20px',
                borderRadius: 18,
                border: b.unlocked ? `1px solid ${b.color}55` : '1px solid var(--card-border)',
                background: b.unlocked ? 'rgba(18, 22, 36, 0.7)' : 'rgba(18, 22, 36, 0.3)',
                opacity: b.unlocked ? 1 : 0.5,
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                transition: 'transform 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: b.unlocked ? `${b.color}22` : 'rgba(255,255,255,0.05)',
                  color: b.unlocked ? b.color : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={26} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{b.name}</h4>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: b.unlocked ? `${b.color}22` : 'rgba(255,255,255,0.05)',
                      color: b.unlocked ? b.color : 'var(--text-secondary)',
                    }}
                  >
                    {b.tier}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {b.desc}
                </p>
                {b.unlocked ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', marginTop: 4, display: 'inline-block' }}>
                    ✓ Unlocked
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, display: 'inline-block' }}>
                    🔒 Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

