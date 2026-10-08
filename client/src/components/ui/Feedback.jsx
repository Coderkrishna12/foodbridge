import { CircleAlert } from 'lucide-react';

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert ${type}`} role={type === 'error' ? 'alert' : undefined}>
      <CircleAlert />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="ic"><Icon /></div>
      <h3 className="h3">{title}</h3>
      {children && <p className="muted">{children}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function FullPageLoader() {
  return (
    <div className="fullpage-loader"><Spinner /></div>
  );
}

export function ListingSkeleton({ count = 3, grid = false }) {
  return (
    <div className={grid ? 'listing-grid' : 'listing-list'}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card lcard">
          <div className="row"><div className="skel" style={{ width: 90, height: 22 }} /><div className="skel" style={{ width: 60, height: 22 }} /></div>
          <div className="skel" style={{ width: '70%', height: 18 }} />
          <div className="skel" style={{ width: '45%', height: 14 }} />
          <div className="skel" style={{ width: '100%', height: 6 }} />
        </div>
      ))}
    </div>
  );
}
