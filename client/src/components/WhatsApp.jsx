import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';

export const waLink = (phone, text) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

// "919876543210" -> "+91 98765 43210"
export const prettyPhone = (p = '') =>
  p.length > 10 ? `+${p.slice(0, -10)} ${p.slice(-10, -5)} ${p.slice(-5)}` : p;

// Contact card between the donor and the claiming NGO (the server only sends
// the other person's number to these two, so this never renders for anyone else).
export function ContactCard({ listing: l, user, isOwner }) {
  const other = isOwner ? l.claimedBy : l.donor;
  if (!other) return null;

  const message = isOwner
    ? `Hi ${other.name}, this is ${user.name} from ${user.organization} (FoodBridge). About "${l.title}" (${l.quantity} servings) that you claimed: `
    : `Hi ${other.name}, this is ${user.name} from ${user.organization} (FoodBridge). I've claimed "${l.title}" (${l.quantity} servings) and will pick it up. `;

  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div>
        <div style={{ fontWeight: 600 }}>Contact {isOwner ? 'the NGO' : 'the donor'}</div>
        <div className="muted small">{other.organization} · {other.name}</div>
      </div>
      {other.phone ? (
        <>
          <a className="btn btn-wa btn-lg btn-block" href={waLink(other.phone, message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> Chat on WhatsApp
          </a>
          <a className="btn btn-secondary btn-block" href={`tel:+${other.phone}`}><Phone /> Call {prettyPhone(other.phone)}</a>
        </>
      ) : (
        <p className="small text-2">{other.organization} hasn't added a WhatsApp number yet.</p>
      )}
      {!user.phone && (
        <p className="xs muted">
          <Link to="/profile">Add your WhatsApp number</Link> so they can reach you too.
        </p>
      )}
    </div>
  );
}
