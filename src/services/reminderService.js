// Smart Reminder System Service for LifeOS
// Manages local storage persistence, repeat rules, snooze logic, and browser Web Notifications

export const REMINDERS_KEY = 'lifeos_reminders_';
export const NOTIF_HISTORY_KEY = 'lifeos_notif_history_';

export function requestNotificationPermission() {
  if ('Notification' in window) {
    return Notification.requestPermission();
  }
  return Promise.resolve('denied');
}

export function sendBrowserNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return notif;
    } catch (e) {
      console.warn('Could not trigger browser notification:', e);
    }
  }
  return null;
}

export function getReminders(userId) {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY + userId);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveReminders(userId, reminders) {
  localStorage.setItem(REMINDERS_KEY + userId, JSON.stringify(reminders));
}

export function getNotificationHistory(userId) {
  try {
    const raw = localStorage.getItem(NOTIF_HISTORY_KEY + userId);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function logNotificationHistory(userId, entry) {
  const history = getNotificationHistory(userId);
  const updated = [{ id: Date.now().toString(), triggeredAt: new Date().toISOString(), ...entry }, ...history].slice(0, 50);
  localStorage.setItem(NOTIF_HISTORY_KEY + userId, JSON.stringify(updated));
}

