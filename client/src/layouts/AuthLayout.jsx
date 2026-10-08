import { CircleCheck } from 'lucide-react';

export default function AuthLayout({ quote, points, children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <span className="eyebrow" style={{ color: '#f3c26b' }}>FoodBridge</span>
        <blockquote>{quote}</blockquote>
        <div className="points">
          {points.map((p) => (
            <div key={p}><CircleCheck /> {p}</div>
          ))}
        </div>
      </aside>
      <div className="auth-main">
        <div className="auth-box page-enter">{children}</div>
      </div>
    </div>
  );
}
