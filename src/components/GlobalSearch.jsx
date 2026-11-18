import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  Search,
  CheckSquare,
  BookOpen,
  Target,
  Activity,
  FileText,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function GlobalSearch({ session, isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchAllData();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const fetchAllData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const uid = session.user.id;
      const [{ data: tasks }, { data: study }, { data: goals }, { data: habits }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('study_sessions').select('*').eq('user_id', uid),
        supabase.from('goals').select('*').eq('user_id', uid),
        supabase.from('habits').select('*').eq('user_id', uid),
      ]);

      // LocalStorage notes
      let notes = [];
      try {
        const rawNotes = localStorage.getItem('lifeos_notes_' + uid);
        if (rawNotes) notes = JSON.parse(rawNotes);
      } catch (_) {}

      const items = [
        ...(tasks || []).map((t) => ({
          type: 'Task',
          id: t.id,
          title: t.title,
          subtitle: `Priority: ${t.priority || 'Medium'} • ${t.is_completed ? 'Completed' : 'Pending'}`,
          path: '/tasks',
          icon: CheckSquare,
          color: '#8b5cf6',
        })),
        ...(goals || []).map((g) => ({
          type: 'Goal',
          id: g.id,
          title: g.title,
          subtitle: `Progress: ${g.current_progress || 0}% • Due: ${g.target_date || 'No date'}`,
          path: '/goals',
          icon: Target,
          color: '#ec4899',
        })),
        ...(habits || []).map((h) => ({
          type: 'Habit',
          id: h.id,
          title: h.title,
          subtitle: `Schedule: ${h.schedule || 'daily'}`,
          path: '/habits',
          icon: Activity,
          color: '#10b981',
        })),
        ...(study || []).map((s) => ({
          type: 'Study',
          id: s.id,
          title: s.subject || 'Study Session',
          subtitle: `${s.duration_minutes || 0} minutes`,
          path: '/study',
          icon: BookOpen,
          color: '#3b82f6',
        })),
        ...notes.map((n) => ({
          type: 'Note',
          id: n.id,
          title: n.title || 'Untitled Note',
          subtitle: `Folder: ${n.folder || 'All'} • ${(n.content || '').replace(/<[^>]*>?/gm, '').slice(0, 45)}...`,
          path: '/notes',
          icon: FileText,
          color: '#f59e0b',
        })),
      ];

      setAllItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults(allItems.slice(0, 8));
      return;
    }
    const q = query.toLowerCase();
    const matched = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.type.toLowerCase().includes(q)
    );
    setResults(matched.slice(0, 15));
  }, [query, allItems]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: 620,
          maxWidth: '92%',
          background: 'rgba(15, 18, 30, 0.95)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--card-border)',
            gap: 12,
          }}
        >
          <Search size={20} color="var(--accent-purple)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, notes, goals, habits, study sessions... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontSize: '1.05rem',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: '10px 14px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {loading ? 'Searching universe...' : `No matching items found for "${query}"`}
            </div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}_${item.id}`}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${item.color}22`,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {item.type}
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <span>Use <strong>Ctrl + K</strong> anywhere to summon global search</span>
          <span>Press <strong>Esc</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
}

