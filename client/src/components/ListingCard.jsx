import { Link } from 'react-router-dom';
import { Building2, HandHeart, MapPin } from 'lucide-react';
import useNow from '../hooks/useNow.js';
import { displayStatus, relative } from '../utils/format.js';
import { Countdown, FoodTag, StatusBadge } from './ListingBits.jsx';
import { PickupCodeChip } from './PickupCode.jsx';
import BadgeList from './Badges.jsx';
import { imageUrl } from '../utils/image.js';

// `preview` renders a non-clickable version (used for the live preview on the post form)
export default function ListingCard({ listing: l, showDonor = true, preview = false, children }) {
  const now = useNow();
  const status = displayStatus(l, now);

  return (
    <article className={`card lcard ${preview ? '' : 'card-hover'}`}>
      {l.images?.length > 0 && (
        <div className="lcard-cover"><img src={imageUrl(l.images[0])} alt={l.title} loading="lazy" /></div>
      )}
      <div className="row between">
        <div className="row" style={{ gap: 6 }}>
          <StatusBadge status={status} />
          <FoodTag type={l.foodType} />
        </div>
        {l.createdAt && <span className="xs muted">{relative(l.createdAt, now)}</span>}
      </div>

      <div className="body">
        {preview ? (
          <span className="lcard-title" style={{ position: 'static' }}>{l.title || 'Your food title'}</span>
        ) : (
          <Link to={`/listings/${l._id}`} className="lcard-title">{l.title}</Link>
        )}
        <div className="meta">
          <span className="servings"><b>{l.quantity || 0}</b> servings</span>
        </div>
        <div className="meta">
          <span><MapPin /> {l.city}</span>
          {showDonor && l.donor && <span><Building2 /> {l.donor.organization}</span>}
          {l.claimedBy && <span><HandHeart /> {l.claimedBy.organization}</span>}
        </div>
      </div>

      <BadgeList listing={l} max={3} />
      {status === 'available' && <Countdown listing={l} now={now} />}
      {status === 'claimed' && l.pickupCode && <div><PickupCodeChip code={l.pickupCode} /></div>}
      {children && <div className="actions">{children}</div>}
    </article>
  );
}
