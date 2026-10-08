import { Timer } from 'lucide-react';
import { FOOD_TYPES, STATUS_LABELS, remainingFraction, timeLeft, urgency } from '../utils/format.js';

export const StatusBadge = ({ status }) => <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>;

export const FoodTag = ({ type }) => (
  <span className={`tag ${type}`}>
    <i className="sq" />
    {FOOD_TYPES[type]}
  </span>
);

export function Countdown({ listing, now }) {
  const u = urgency(listing, now);
  const pct = Math.round(remainingFraction(listing, now) * 100);
  return (
    <div className={`countdown ${u}`}>
      <div className="lbl">
        <span><Timer /> {timeLeft(listing.expiresAt, now)}</span>
        {u === 'crit' && <span>Urgent</span>}
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Time remaining">
        <i style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
    </div>
  );
}
