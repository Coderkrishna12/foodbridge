export const FOOD_TYPES = { veg: 'Veg', 'non-veg': 'Non-veg', mixed: 'Mixed' };

// Display status: an "available" listing past its expiry shows as expired
export const displayStatus = (l, now = Date.now()) =>
  l.status === 'available' && new Date(l.expiresAt) <= now ? 'expired' : l.status;

export const STATUS_LABELS = {
  available: 'Available',
  claimed: 'Awaiting pickup',
  completed: 'Picked up',
  expired: 'Expired',
};

export function timeLeft(date, now = Date.now()) {
  const ms = new Date(date) - now;
  if (ms <= 0) return 'Expired';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m left`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h left`;
}

// Fraction of the listing's window that remains (1 = just posted, 0 = expired)
export function remainingFraction(l, now = Date.now()) {
  const start = new Date(l.createdAt).getTime();
  const end = new Date(l.expiresAt).getTime();
  if (end <= start) return 0;
  return Math.max(0, Math.min(1, (end - now) / (end - start)));
}

export function urgency(l, now = Date.now()) {
  const ms = new Date(l.expiresAt) - now;
  if (ms < 2 * 3600e3) return 'crit';
  if (ms < 6 * 3600e3) return 'warn';
  return 'ok';
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export function relative(date, now = Date.now()) {
  const s = Math.round((now - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// Date -> value for <input type="datetime-local"> in local time
export function toLocalInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
