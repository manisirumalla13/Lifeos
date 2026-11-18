import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { applySettingsToDOM } from './services/settingsService';

// Pages
import Dashboard from './pages/Dashboard';
import MyDay from './pages/MyDay';
import LifeMate from './pages/LifeMate';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import FocusMode from './pages/FocusMode';
import Study from './pages/Study';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Notes, { QuickCapture } from './pages/Notes';
import Finances from './pages/Finances';
import Wellness from './pages/Wellness';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

// Components
import GlobalSearch from './components/GlobalSearch';
import QuickTaskModal from './components/QuickTaskModal';

// Icons
import {
  LayoutDashboard,
  Sun,
  Sparkles,
  CheckSquare,
  CalendarDays,
  Timer,
  BookOpen,
  Activity,
  Target,
  FileText,
  Wallet,
  HeartPulse,
  Trophy,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Search,
  Plus,
} from 'lucide-react';

import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);

  useEffect(() => {
    applySettingsToDOM();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcut listener (Ctrl+K, Ctrl+N, Ctrl+Shift+T, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape closes any open modal
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuickCaptureOpen(false);
        setQuickTaskOpen(false);
        return;
      }

      // Ctrl + K: Global Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }

      // Ctrl + Shift + T: Quick Task
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setQuickTaskOpen(true);
      }

      // Ctrl + N: Quick Note (prevent default new browser window)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        // Only if not focused in an input/textarea
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          setQuickCaptureOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading LifeOS...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <div id="app">
        {/* Navigation Sidebar */}
        <nav className="sidebar" style={{ overflowY: 'auto' }}>
          {/* macOS window dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: 8,
                padding: '4px 8px',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
              title="Global Search (Ctrl + K)"
            >
              <Search size={12} />
              <span>⌘K</span>
            </button>
          </div>

          {/* Brand header */}
          <div className="logo-container">
            <div className="logo">LIFEOS</div>
            <div className="logo-sub">The All-In-One Life Operating System</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(56, 189, 248, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 14px', fontWeight: 800 }}>
              Command
            </div>

            <NavLink to="/" end className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/my-day" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Sun size={17} />
              <span>My Day</span>
            </NavLink>

            <NavLink to="/assistant" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Sparkles size={17} style={{ color: 'var(--accent-pink)' }} />
              <span>LifeMate AI</span>
            </NavLink>

            <NavLink to="/tasks" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <CheckSquare size={17} />
              <span>Tasks</span>
            </NavLink>

            <NavLink to="/calendar" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <CalendarDays size={17} />
              <span>Calendar</span>
            </NavLink>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px 6px', fontWeight: 700 }}>
              Deep Work
            </div>

            <NavLink to="/focus" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Timer size={17} />
              <span>Focus Mode</span>
            </NavLink>

            <NavLink to="/study" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <BookOpen size={17} />
              <span>Study</span>
            </NavLink>

            <NavLink to="/notes" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <FileText size={17} />
              <span>Smart Notes</span>
            </NavLink>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px 6px', fontWeight: 700 }}>
              Growth & Life
            </div>

            <NavLink to="/habits" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Activity size={17} />
              <span>Habits</span>
            </NavLink>

            <NavLink to="/goals" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Target size={17} />
              <span>Goals</span>
            </NavLink>

            <NavLink to="/wellness" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <HeartPulse size={17} />
              <span>Wellness</span>
            </NavLink>

            <NavLink to="/finances" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Wallet size={17} />
              <span>Finances</span>
            </NavLink>

            <NavLink to="/achievements" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Trophy size={17} />
              <span>Mastery</span>
            </NavLink>

            <NavLink to="/analytics" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <BarChart3 size={17} />
              <span>Analytics</span>
            </NavLink>

            <NavLink to="/reminders" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <Bell size={17} />
              <span>Reminders</span>
            </NavLink>

            <NavLink to="/settings" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <SettingsIcon size={17} />
              <span>Settings</span>
            </NavLink>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <button className="nav-btn logout-btn" style={{ width: '100%' }} onClick={() => supabase.auth.signOut()}>
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main id="content">
          <Routes>
            <Route path="/" element={<Dashboard session={session} />} />
            <Route path="/my-day" element={<MyDay session={session} />} />
            <Route path="/assistant" element={<LifeMate session={session} />} />
            <Route path="/tasks" element={<Tasks session={session} />} />
            <Route path="/calendar" element={<CalendarView session={session} />} />
            <Route path="/focus" element={<FocusMode session={session} />} />
            <Route path="/study" element={<Study session={session} />} />
            <Route path="/habits" element={<Habits session={session} />} />
            <Route path="/goals" element={<Goals session={session} />} />
            <Route path="/notes" element={<Notes session={session} />} />
            <Route path="/wellness" element={<Wellness session={session} />} />
            <Route path="/finances" element={<Finances session={session} />} />
            <Route path="/achievements" element={<Achievements session={session} />} />
            <Route path="/analytics" element={<Analytics session={session} />} />
            <Route path="/reminders" element={<Reminders session={session} />} />
            <Route path="/settings" element={<Settings session={session} />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearch
        session={session}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <QuickTaskModal
        session={session}
        isOpen={quickTaskOpen}
        onClose={() => setQuickTaskOpen(false)}
      />

      {quickCaptureOpen && (
        <QuickCapture
          session={session}
          onClose={() => setQuickCaptureOpen(false)}
        />
      )}
    </Router>
  );
}

export default App;
