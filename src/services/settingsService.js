// Settings Service for LifeOS
export const SETTINGS_KEY = 'lifeos_user_settings';

export const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light' | 'midnight'
  accentColor: '#8b5cf6', // purple default
  layout: 'comfortable', // 'comfortable' | 'compact'
  dateFormat: 'YYYY-MM-DD',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  displayName: '',
  browserNotifs: true,
  ambientAutoPlay: false,
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (_) {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applySettingsToDOM(settings);
}

export function applySettingsToDOM(settings = getSettings()) {
  const root = document.documentElement;

  // Apply accent color
  if (settings.accentColor) {
    root.style.setProperty('--accent-purple', settings.accentColor);
    root.style.setProperty(
      '--gradient-glow',
      `linear-gradient(135deg, ${settings.accentColor}, #3b82f6)`
    );
  }

  // Apply theme background changes
  if (settings.theme === 'midnight') {
    root.style.setProperty('--bg-color', '#020205');
    root.style.setProperty('--sidebar-bg', 'rgba(5, 7, 15, 0.95)');
    root.style.setProperty('--card-bg', 'rgba(10, 14, 26, 0.7)');
  } else if (settings.theme === 'light') {
    root.style.setProperty('--bg-color', '#f8fafc');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--sidebar-bg', 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.8)');
    root.style.setProperty('--card-border', 'rgba(0, 0, 0, 0.08)');
  } else {
    // Default dark
    root.style.setProperty('--bg-color', '#030308');
    root.style.setProperty('--text-primary', '#f8fafc');
    root.style.setProperty('--text-secondary', '#94a3b8');
    root.style.setProperty('--sidebar-bg', 'rgba(10, 12, 22, 0.85)');
    root.style.setProperty('--card-bg', 'rgba(18, 22, 36, 0.6)');
    root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)');
  }
}

