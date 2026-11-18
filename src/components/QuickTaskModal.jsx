import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { CheckSquare, X, Plus } from 'lucide-react';

export default function QuickTaskModal({ session, isOpen, onClose, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from('tasks').insert([
        {
          user_id: session.user.id,
          title: title.trim(),
          priority,
          due_date: dueDate,
          is_completed: false,
        },
      ]).select();

      if (!error) {
        if (onTaskCreated) onTaskCreated(data?.[0]);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: 440,
          maxWidth: '92%',
          background: 'rgba(18, 22, 36, 0.95)',
          borderRadius: 20,
          padding: 24,
          border: '1px solid var(--card-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare size={20} color="var(--accent-purple)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Quick Add Task</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none',
              fontSize: '0.95rem',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              className="secondary-btn"
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="primary-btn"
              style={{ padding: '8px 20px' }}
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

