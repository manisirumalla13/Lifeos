import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  Award,
  Zap,
  Activity,
  Filter,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics({ session }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'week' | 'month' | 'all'

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uid = session.user.id;
      const [{ data: t }, { data: s }, { data: h }, { data: g }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('study_sessions').select('*').eq('user_id', uid),
        supabase.from('habits').select('*, habit_completions(*)').eq('user_id', uid),
        supabase.from('goals').select('*').eq('user_id', uid),
      ]);

      setTasks(t || []);
      setStudySessions(s || []);
      setHabits(h || []);
      setGoals(g || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalStudyMinutes = studySessions.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const avgStudyDuration = studySessions.length > 0 ? Math.round(totalStudyMinutes / studySessions.length) : 0;

  const totalHabitCompletions = habits.reduce((acc, h) => acc + (h.habit_completions?.length || 0), 0);
  const avgGoalProgress = goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.current_progress || 0), 0) / goals.length) : 0;

  // Study hours per day (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const studyByDay = last7Days.map((dayStr) => {
    return studySessions
      .filter((s) => s.start_time && s.start_time.startsWith(dayStr))
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  });

  // Task priority distribution
  const highTasks = tasks.filter((t) => t.priority === 'High').length;
  const medTasks = tasks.filter((t) => t.priority === 'Medium').length;
  const lowTasks = tasks.filter((t) => t.priority === 'Low').length;

  // Chart configs
  const studyChartData = {
    labels: last7Days.map((d) => {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Study Immersion (Minutes)',
        data: studyByDay,
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: '#8b5cf6',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(18, 22, 36, 0.9)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        beginAtZero: true,
      },
    },
  };

  const priorityChartData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [highTasks || 1, medTasks || 1, lowTasks || 1],
        backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  // CSV Export
  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Section,Item,Metric 1,Metric 2\n';

    tasks.forEach((t) => {
      csvContent += `Task,"${t.title.replace(/"/g, '""')}",${t.priority},${t.is_completed ? 'Completed' : 'Pending'}\n`;
    });

    studySessions.forEach((s) => {
      csvContent += `Study Session,"${(s.subject || '').replace(/"/g, '""')}",${s.duration_minutes}m,${s.start_time || ''}\n`;
    });

    goals.forEach((g) => {
      csvContent += `Goal,"${g.title.replace(/"/g, '""')}",${g.current_progress}%,${g.target_date || ''}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LifeOS_Productivity_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} style={{ color: '#00f2fe' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                Life Analytics // Ground-Truth Telemetry
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={exportCSV}
              className="secondary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="primary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', background: 'linear-gradient(135deg, #00f2fe, #a855f7)' }}
            >
              <Award size={15} /> Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: 25 }}>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper purple">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <h4>{taskCompletionRate}%</h4>
            <p>Task Completion ({completedTasks}/{totalTasks})</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h4>{Math.round(totalStudyMinutes / 60 * 10) / 10}h</h4>
            <p>Total Immersion ({avgStudyDuration}m avg)</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper green">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h4>{totalHabitCompletions}</h4>
            <p>Habits Executed ({habits.length} routines)</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper purple" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-pink)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h4>{avgGoalProgress}%</h4>
            <p>Avg Goal Progress ({goals.length} goals)</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 25, marginBottom: 25 }}>
        {/* Weekly Study Trend */}
        <div className="card glass" style={{ height: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--accent-purple)" /> 7-Day Study Immersion
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Minutes / Day</span>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={studyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Task Priority Distribution Doughnut */}
        <div className="card glass" style={{ height: 340, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 15 }}>
            Task Priority Ratio
          </h3>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={priorityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Goal Maturity Progress Bars */}
      <div className="card glass">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={20} color="var(--accent-purple)" /> Goal Execution Trajectory
        </h3>

        {goals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No goals recorded yet. Head over to the Goals tab to create your first objective!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {goals.map((g) => (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.92rem' }}>
                  <span style={{ fontWeight: 600 }}>{g.title}</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{g.current_progress}%</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${g.current_progress}%`,
                      height: '100%',
                      background: 'var(--gradient-glow)',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

