import { listingBadges } from '../utils/badges.js';

// Packaging / preparation / dietary badges. `max` collapses the rest into "+N".
export default function BadgeList({ listing, max }) {
  const all = listingBadges(listing);
  if (!all.length) return null;
  const shown = max ? all.slice(0, max) : all;
  const rest = all.length - shown.length;
  return (
    <div className="fbadges">
      {shown.map(({ key, label, icon: Icon, kind }) => (
        <span key={key} className={`fbadge ${kind}`}><Icon /> {label}</span>
      ))}
      {rest > 0 && <span className="fbadge more">+{rest}</span>}
    </div>
  );
}

// Grouped version for the detail page
export function BadgeGroups({ listing }) {
  const all = listingBadges(listing);
  if (!all.length) return null;
  const groups = [
    ['Packaging', all.filter((b) => b.kind === 'pack')],
    ['Preparation', all.filter((b) => b.kind === 'prep')],
    ['Dietary & allergens', all.filter((b) => b.kind === 'diet' || b.kind === 'warn')],
  ].filter(([, items]) => items.length);
  return (
    <div className="badge-groups">
      {groups.map(([title, items]) => (
        <div key={title}>
          <div className="k">{title}</div>
          <div className="fbadges">
            {items.map(({ key, label, icon: Icon, kind }) => <span key={key} className={`fbadge ${kind}`}><Icon /> {label}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
