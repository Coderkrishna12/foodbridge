import { Link } from 'react-router-dom';

export function LogoMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M8 20c0-6 4-10 12-11-1 8-5 12-11 12" fill="none" stroke="#f3c26b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 24c3-4 6-7 10-10" fill="none" stroke="var(--brand-ink)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="brand" style={light ? { color: '#fff' } : undefined}>
      <LogoMark />
      FoodBridge
    </Link>
  );
}
