import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { askLifeMate, getAIConfig, saveAIConfig, isAIConfigured, testAPIConnection } from '../services/aiService';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Settings,
  Calendar,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Coffee,
  Key,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  BookOpen,
  Heart,
  ExternalLink,
  AlertTriangle,
  Check,
  X,
  Wifi,
  WifiOff,
  Trash2,
} from 'lucide-react';

// Simple markdown-like renderer for AI responses
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const dataRows = tableRows.slice(2); // skip separator row
      elements.push(
        <div key={`table-${elements.length}`} style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                {headers.split('|').filter(c => c.trim()).map((h, i) => (
                  <th key={i} style={{ padding: '6px 10px', borderBottom: '2px solid rgba(0,242,254,0.3)', textAlign: 'left', color: '#00f2fe', fontWeight: 700 }}>
                    {formatInline(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri}>
                  {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                    <td key={ci} style={{ padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>
                      {formatInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={`bq-${elements.length}`} style={{
          borderLeft: '3px solid #a855f7',
          margin: '8px 0',
          padding: '6px 14px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          background: 'rgba(168,85,247,0.06)',
          borderRadius: '0 8px 8px 0',
        }}>
          {blockquoteLines.map((l, i) => <span key={i}>{formatInline(l)}<br/></span>)}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        flushBlockquote();
        inTable = true;
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      inTable = false;
      flushTable();
    }

    // Blockquote
    if (line.startsWith('>')) {
      if (!inBlockquote) inBlockquote = true;
      blockquoteLines.push(line.slice(1).trim());
      continue;
    } else if (inBlockquote) {
      inBlockquote = false;
      flushBlockquote();
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: '1.1rem', fontWeight: 800, margin: '14px 0 8px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>{formatInline(line.slice(4))}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: '1.2rem', fontWeight: 800, margin: '14px 0 8px', color: '#fff' }}>{formatInline(line.slice(3))}</h2>);
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '━━━') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />);
      continue;
    }

    // Bullet points
    if (line.match(/^\s*[-•]\s/)) {
      const indent = line.match(/^(\s*)/)[1].length;
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginLeft: Math.min(indent * 4, 32), margin: '3px 0 3px ' + Math.min(indent * 4, 32) + 'px' }}>
          <span style={{ color: '#00f2fe', flexShrink: 0 }}>•</span>
          <span>{formatInline(line.replace(/^\s*[-•]\s/, ''))}</span>
        </div>
      );
      continue;
    }

    // Numbered lists
    if (line.match(/^\s*\d+\.\s/)) {
      const num = line.match(/^\s*(\d+)\./)[1];
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0' }}>
          <span style={{ color: '#a855f7', fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{num}.</span>
          <span>{formatInline(line.replace(/^\s*\d+\.\s/, ''))}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
      continue;
    }

    // Regular paragraph
    elements.push(<p key={i} style={{ margin: '3px 0', lineHeight: 1.6 }}>{formatInline(line)}</p>);
  }

  // Flush remaining
  if (inTable) flushTable();
  if (inBlockquote) flushBlockquote();

  return elements;
}

// Inline formatting: **bold**, *italic*, `code`, [links], emoji
function formatInline(text) {
  if (!text) return text;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
    // Code
    const codeMatch = remaining.match(/`([^`]+?)`/);

    // Find earliest match
    let earliest = null;
    let earliestIdx = Infinity;

    if (boldMatch && remaining.indexOf(boldMatch[0]) < earliestIdx) {
      earliest = { type: 'bold', match: boldMatch };
      earliestIdx = remaining.indexOf(boldMatch[0]);
    }
    if (codeMatch && remaining.indexOf(codeMatch[0]) < earliestIdx) {
      earliest = { type: 'code', match: codeMatch };
      earliestIdx = remaining.indexOf(codeMatch[0]);
    }
    if (italicMatch && remaining.indexOf(italicMatch[0]) < earliestIdx && (!boldMatch || remaining.indexOf(italicMatch[0]) !== remaining.indexOf(boldMatch[0]))) {
      earliest = { type: 'italic', match: italicMatch };
      earliestIdx = remaining.indexOf(italicMatch[0]);
    }

    if (!earliest) {
      parts.push(remaining);
      break;
    }

    // Add text before the match
    if (earliestIdx > 0) {
      parts.push(remaining.slice(0, earliestIdx));
    }

    if (earliest.type === 'bold') {
      parts.push(<strong key={key++} style={{ color: '#fff', fontWeight: 700 }}>{earliest.match[1]}</strong>);
      remaining = remaining.slice(earliestIdx + earliest.match[0].length);
    } else if (earliest.type === 'italic') {
      parts.push(<em key={key++} style={{ color: 'var(--text-secondary)' }}>{earliest.match[1]}</em>);
      remaining = remaining.slice(earliestIdx + earliest.match[0].length);
    } else if (earliest.type === 'code') {
      parts.push(<code key={key++} style={{ background: 'rgba(0,242,254,0.1)', color: '#00f2fe', padding: '1px 6px', borderRadius: 4, fontSize: '0.88em' }}>{earliest.match[1]}</code>);
      remaining = remaining.slice(earliestIdx + earliest.match[0].length);
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

export default function LifeMate({ session }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### 🤖 LifeMate AI — Online\n\nHello! I'm **LifeMate**, your personal AI productivity coach.\n\nI have **real-time awareness** of your LifeOS ecosystem — tasks, study sessions, goals, and habits. I analyze your actual data to give you personalized advice.\n\n**Try asking me:**\n- 📅 "Plan my day" — intelligent time-blocked schedule\n- 🎯 "Break down my goal" — decompose into actionable steps\n- 📊 "Analyze my productivity" — patterns & insights\n- 📚 "Study strategy" — evidence-based techniques\n- 🧘 "I need a break" — active recovery protocol`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState({ tasks: [], studySessions: [], goals: [], habits: [] });
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(getAIConfig());
  const [configSaved, setConfigSaved] = useState(false);
  const [addedNotice, setAddedNotice] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [aiConnected, setAiConnected] = useState(isAIConfigured());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchContext();
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Keep AI status in sync
  useEffect(() => {
    setAiConnected(isAIConfigured());
  }, [config]);

  const fetchContext = async () => {
    try {
      const uid = session.user.id;
      const [{ data: tasks }, { data: study }, { data: goals }, { data: habits }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('study_sessions').select('*').eq('user_id', uid),
        supabase.from('goals').select('*').eq('user_id', uid),
        supabase.from('habits').select('*').eq('user_id', uid),
      ]);

      setContextData({
        tasks: tasks || [],
        studySessions: study || [],
        goals: goals || [],
        habits: habits || [],
      });
    } catch (err) {
      console.error('Error fetching context for LifeMate:', err);
    }
  };

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Refresh context before each query for real-time accuracy
    await fetchContext();

    try {
      const response = await askLifeMate(userMsg.text, contextData, messages);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `### ⚠️ Error\n\n${err.message}\n\n*If this persists, check your API key in **AI Settings** or try again in a moment.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveAIConfig(config);
    setAiConnected(isAIConfigured());
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
    }, 1200);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testAPIConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'cleared-' + Date.now(),
        sender: 'assistant',
        text: '### 🔄 Conversation Reset\n\nChat history cleared. I still have full access to your LifeOS data. What would you like to work on?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', animation: 'fadeIn 0.4s ease' }}>
      {/* Top Window Bar */}
      <div className="card glass" style={{ marginBottom: 12, padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              LifeOS // LifeMate AI Intelligence
            </span>

            {/* Live AI Status Indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: aiConnected ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              border: `1px solid ${aiConnected ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              padding: '3px 10px', borderRadius: 20,
              fontSize: '0.72rem', fontWeight: 700,
              color: aiConnected ? '#10b981' : '#f59e0b',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: aiConnected ? '#10b981' : '#f59e0b',
                boxShadow: aiConnected ? '0 0 8px #10b981' : 'none',
              }} />
              {aiConnected ? 'AI LIVE' : 'HEURISTIC MODE'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {addedNotice && (
              <span style={{ fontSize: '0.82rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                {addedNotice}
              </span>
            )}
            <button
              onClick={handleClearChat}
              className="secondary-btn"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              title="Clear chat history"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => { setShowConfig(true); setTestResult(null); }}
              className="secondary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Settings size={14} />
              <span>AI Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Setup Banner — only shown when no API key is configured */}
      {!aiConnected && (
        <div
          onClick={() => { setShowConfig(true); setTestResult(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'linear-gradient(135deg, rgba(0,242,254,0.08), rgba(168,85,247,0.08))',
            border: '1px solid rgba(0,242,254,0.25)',
            borderRadius: 14, padding: '12px 18px', marginBottom: 12,
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Key size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: 2 }}>
              Upgrade to Real AI — Free Gemini API
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Get a free API key from Google AI Studio in 30 seconds. Click here to configure.
            </div>
          </div>
          <ExternalLink size={16} style={{ color: '#00f2fe', flexShrink: 0 }} />
        </div>
      )}

      {/* Suggested Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 8 }}>
        {[
          { icon: Calendar, color: '#a855f7', label: 'Plan My Day', prompt: 'Plan my schedule for today in chronological order with realistic time blocks and break times.' },
          { icon: Target, color: '#ec4899', label: 'Break Down Goal', prompt: 'Break down my top active goal into 4 concrete subtasks with time estimates and priorities.' },
          { icon: Zap, color: '#3b82f6', label: 'Productivity Analysis', prompt: 'Analyze my productivity patterns, task completion rate, and identify areas for improvement.' },
          { icon: BookOpen, color: '#10b981', label: 'Study Strategy', prompt: 'Give me a personalized study strategy based on my recent study sessions and goals.' },
          { icon: Coffee, color: '#f59e0b', label: 'Suggest Break', prompt: 'I have been working hard. Recommend the right type of break based on my activity level.' },
          { icon: Heart, color: '#ef4444', label: 'Motivation', prompt: 'I am feeling stuck and unmotivated. Help me get back on track with concrete next steps.' },
        ].map(({ icon: Icon, color, label, prompt }) => (
          <button
            key={label}
            onClick={() => handleQuickPrompt(prompt)}
            className="secondary-btn"
            style={{
              whiteSpace: 'nowrap', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: 6,
              borderRadius: 20, padding: '7px 14px',
              border: `1px solid ${color}33`,
            }}
          >
            <Icon size={14} style={{ color }} /> {label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div
        className="glass"
        style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 16,
          marginBottom: 12,
        }}
      >
        {messages.map((m) => {
          const isBot = m.sender === 'assistant';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex', gap: 12,
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: isBot ? '88%' : '75%',
                flexDirection: isBot ? 'row' : 'row-reverse',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: isBot ? 'linear-gradient(135deg, #00f2fe, #a855f7)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                  boxShadow: isBot ? '0 0 12px rgba(0,242,254,0.3)' : 'none',
                }}
              >
                {isBot ? <Bot size={18} color="#fff" /> : <User size={18} color="#fff" />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    padding: isBot ? '14px 18px' : '12px 16px',
                    borderRadius: isBot ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                    background: isBot ? 'rgba(255, 255, 255, 0.04)' : 'linear-gradient(135deg, #00f2fe, #a855f7)',
                    border: isBot ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: '#fff', lineHeight: 1.6, fontSize: '0.92rem',
                    wordBreak: 'break-word',
                  }}
                >
                  {isBot ? renderMarkdown(m.text) : m.text}
                </div>
                <span
                  style={{
                    fontSize: '0.7rem', color: 'var(--text-secondary)',
                    marginTop: 4, display: 'block',
                    textAlign: isBot ? 'left' : 'right',
                    paddingLeft: 4, paddingRight: 4,
                  }}
                >
                  {isBot && (
                    <span style={{ marginRight: 6 }}>
                      {aiConnected ? '🤖 Gemini' : '⚡ Heuristic'}
                    </span>
                  )}
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start', maxWidth: '88%', animation: 'fadeIn 0.3s ease' }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 0 12px rgba(0,242,254,0.3)',
              }}
            >
              <Bot size={18} color="#fff" />
            </div>
            <div
              style={{
                padding: '12px 18px', borderRadius: '4px 18px 18px 18px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)', fontSize: '0.88rem',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#00f2fe', opacity: 0.6,
                    animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              {aiConnected ? 'LifeMate is thinking...' : 'Generating response...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          display: 'flex', gap: 10,
          background: 'rgba(10, 14, 30, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,242,254,0.2)',
          borderRadius: 14, padding: '6px 10px 6px 18px',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={aiConnected ? 'Ask LifeMate anything... (powered by Gemini AI)' : 'Ask LifeMate... (configure API key for AI responses)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: '#fff', outline: 'none', fontSize: '0.92rem',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="primary-btn"
          style={{
            padding: '9px 16px', borderRadius: 10,
            opacity: loading || !input.trim() ? 0.4 : 1,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Send size={15} />
        </button>
      </form>

      {/* ━━━ AI Configuration Modal ━━━ */}
      {showConfig && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowConfig(false)}
        >
          <div
            className="glass"
            style={{
              width: 540, maxWidth: '94%', maxHeight: '90vh', overflowY: 'auto',
              padding: 28, borderRadius: 22,
              border: '1px solid rgba(0,242,254,0.2)',
              background: 'rgba(10, 14, 30, 0.97)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>AI Configuration</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Connect LifeMate to a real AI model</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Setup Guide */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,242,254,0.06), rgba(168,85,247,0.06))',
              border: '1px solid rgba(0,242,254,0.15)',
              borderRadius: 14, padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#00f2fe', marginBottom: 8 }}>
                🚀 Quick Setup — Get a Free Gemini API Key
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.8 }}>
                <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#00f2fe', textDecoration: 'none', fontWeight: 600 }}>Google AI Studio → API Keys <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a></li>
                <li>Sign in with your Google account</li>
                <li>Click <strong style={{ color: '#fff' }}>"Create API Key"</strong></li>
                <li>Copy the key and paste it below</li>
              </ol>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={13} style={{ color: '#10b981' }} />
                Your key is stored only in your browser's localStorage — never sent to any server except Google's API.
              </div>
            </div>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Provider Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>
                  AI PROVIDER
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', outline: 'none', fontSize: '0.9rem',
                  }}
                >
                  <option value="gemini">Google Gemini API (Recommended — Free Tier)</option>
                  <option value="openai">OpenAI ChatGPT API</option>
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>
                  API KEY
                </label>
                <input
                  type="password"
                  placeholder={config.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  value={config.apiKey}
                  onChange={(e) => { setConfig({ ...config, apiKey: e.target.value }); setTestResult(null); }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', outline: 'none', fontSize: '0.9rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Model Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>
                  MODEL
                </label>
                {config.provider === 'gemini' ? (
                  <select
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', outline: 'none', fontSize: '0.9rem',
                    }}
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Free)</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Fastest)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Most Capable)</option>
                  </select>
                ) : (
                  <select
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', outline: 'none', fontSize: '0.9rem',
                    }}
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
                    <option value="gpt-4o">GPT-4o (Most Capable)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                )}
              </div>

              {/* Test Connection Button + Result */}
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={!config.apiKey || testing}
                  className="secondary-btn"
                  style={{
                    width: '100%', padding: '10px', fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: !config.apiKey ? 0.4 : 1,
                    cursor: !config.apiKey ? 'not-allowed' : 'pointer',
                  }}
                >
                  {testing ? (
                    <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Testing connection...</>
                  ) : (
                    <><Wifi size={15} /> Test Connection</>
                  )}
                </button>

                {testResult && (
                  <div style={{
                    marginTop: 10, padding: '10px 14px', borderRadius: 10,
                    background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: testResult.success ? '#10b981' : '#ef4444',
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {testResult.success ? (
                      <><CheckCircle size={16} /> <span><strong>Connection successful!</strong> Model: {testResult.model}</span></>
                    ) : (
                      <><AlertTriangle size={16} /> <span><strong>Connection failed:</strong> {testResult.error}</span></>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="secondary-btn"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{
                    padding: '10px 24px',
                    background: configSaved ? 'linear-gradient(135deg, #10b981, #00f2fe)' : 'linear-gradient(135deg, #00f2fe, #a855f7)',
                  }}
                >
                  {configSaved ? (
                    <><Check size={15} /> Saved!</>
                  ) : (
                    <><ShieldCheck size={15} /> Save & Activate</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
