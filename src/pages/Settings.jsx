import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settingsService';
import {
  Settings as SettingsIcon,
  Palette,
  Layout,
  Bell,
  Globe,
  User,
  Check,
  Moon,
  Sun,
  Sparkles,
  Shield,
  Volume2,
} from 'lucide-react';

export default function Settings({ session }) {
  const [settings, setSettings] = useState(getSettings());
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleChange = (key, val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const accentColors = [
    { name: 'Neon Purple', hex: '#8b5cf6' },
    { name: 'Cyber Blue', hex: '#3b82f6' },
    { name: 'Emerald Wave', hex: '#10b981' },
    { name: 'Rose Bloom', hex: '#ec4899' },
    { name: 'Electric Amber', hex: '#f59e0b' },
    { name: 'Solar Cyan', hex: '#06b6d4' },
  ];

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
              <SettingsIcon size={18} style={{ color: '#00f2fe' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                System Configuration // Preferences
              </span>
            </div>
          </div>

          {savedNotice && (
            <span style={{ fontSize: '0.85rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <Check size={14} /> Preferences Synchronized
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840 }}>
        {/* Visual Identity & Accent Colors */}
        <div className="card glass">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={20} color="var(--accent-purple)" /> Color Palette & Accent Tone
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            {accentColors.map((color) => {
              const isSelected = settings.accentColor === color.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => handleChange('accentColor', color.hex)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: isSelected ? `2px solid ${color.hex}` : '1px solid var(--card-border)',
                    background: isSelected ? `${color.hex}22` : 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    color: '#fff',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: color.hex,
                      boxShadow: `0 0 10px ${color.hex}`,
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{color.name}</span>
                </button>
              );
            })}
          </div>

          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Theme Environment
          </h4>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { id: 'dark', label: 'Dark Obsidian (Default)' },
              { id: 'midnight', label: 'Midnight Void' },
              { id: 'light', label: 'Daylight Pearl' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleChange('theme', t.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: settings.theme === t.id ? '1px solid var(--accent-purple)' : '1px solid var(--card-border)',
                  background: settings.theme === t.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0,0,0,0.2)',
                  color: settings.theme === t.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name & Identity */}
        <div className="card glass">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={20} color="var(--accent-purple)" /> User Identity & Greeting
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Preferred Display Name
              </label>
              <input
                type="text"
                placeholder={session?.user?.email?.split('@')[0] || 'User'}
                value={settings.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Account Email
              </label>
              <input
                type="text"
                disabled
                value={session?.user?.email || ''}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>
        </div>

        {/* Layout & Density */}
        <div className="card glass">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layout size={20} color="var(--accent-purple)" /> Interface Density
          </h3>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => handleChange('layout', 'comfortable')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 14,
                border: settings.layout === 'comfortable' ? '1px solid var(--accent-purple)' : '1px solid var(--card-border)',
                background: settings.layout === 'comfortable' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0,0,0,0.2)',
                color: settings.layout === 'comfortable' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Comfortable Density</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4, opacity: 0.8 }}>Spacious cards, rich padding, immersive 3D</div>
            </button>

            <button
              type="button"
              onClick={() => handleChange('layout', 'compact')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 14,
                border: settings.layout === 'compact' ? '1px solid var(--accent-purple)' : '1px solid var(--card-border)',
                background: settings.layout === 'compact' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0,0,0,0.2)',
                color: settings.layout === 'compact' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Compact Mode</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4, opacity: 0.8 }}>Higher data density, tighter task lists</div>
            </button>
          </div>
        </div>

        {/* Notifications & Audio */}
        <div className="card glass">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} color="var(--accent-purple)" /> Notification Behavior
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Browser Push Notifications</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Receive audio-visual alarms when task deadlines or reminders trigger
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.browserNotifs}
              onChange={(e) => handleChange('browserNotifs', e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

