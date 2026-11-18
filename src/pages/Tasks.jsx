import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Tasks({ session }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [session]);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', session.user.id);
    if (!error) setTasks(data);
  };

  const addTask = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('tasks').insert([
      { user_id: session.user.id, title, priority, due_date: dueDate, is_completed: false }
    ]);
    if (!error) {
      setTitle('');
      setDueDate('');
      fetchTasks();
    }
  };

  const toggleTask = async (id, is_completed) => {
    await supabase.from('tasks').update({ is_completed: !is_completed }).eq('id', id);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
  };

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
            LifeOS // Task Operations Manager
          </span>
        </div>
      </div>

      <div className="card glass" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Deploy New Objective</h3>
        <form onSubmit={addTask} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Objective title (e.g. Complete systems architecture review)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              flex: 1,
              minWidth: 200,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none',
            }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
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
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--card-border)',
              color: '#fff',
              outline: 'none',
            }}
          />
          <button type="submit" className="primary-btn">Add Objective</button>
        </form>
      </div>

      <div className="task-list">
        {tasks.map(t => (
          <div key={t.id} className={`task-item ${t.is_completed ? 'completed' : ''}`}>
            <span style={{ fontSize: '0.95rem' }}>{t.title} - <strong style={{ color: t.priority === 'High' ? '#f87171' : t.priority === 'Medium' ? 'var(--accent-cyan)' : '#34d399' }}>{t.priority}</strong> ({t.due_date})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleTask(t.id, t.is_completed)} className="secondary-btn">{t.is_completed ? 'Undo' : 'Complete'}</button>
              <button onClick={() => deleteTask(t.id)} className="secondary-btn danger">Delete</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="card glass" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            No objectives currently queued.
          </div>
        )}
      </div>
    </div>
  );
}
