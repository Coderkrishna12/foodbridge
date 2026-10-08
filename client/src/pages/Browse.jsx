import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, MapPin, RefreshCw, SearchX } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { EmptyState, ListingSkeleton, Spinner } from '../components/ui/Feedback.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { FOOD_TYPES } from '../utils/format.js';

export default function Browse() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [city, setCity] = useState(user.city);
  const [foodType, setFoodType] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const load = async (c = city, f = foodType) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (c.trim()) q.set('city', c.trim());
    if (f) q.set('foodType', f);
    try {
      setListings(await api(`/listings?${q}`));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodType]);

  const claim = async (l) => {
    setClaiming(l._id);
    try {
      await api(`/listings/${l._id}/claim`, { method: 'POST' });
      toast.success(`Claimed! ${l.quantity} servings from ${l.donor.organization} are yours.`);
      navigate(`/listings/${l._id}`);
    } catch (err) {
      toast.error(err.message);
      setClaiming(null);
      load(); // someone else may have claimed it, so refresh the feed
    }
  };

  const totalServings = listings.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="container page">
      <div className="page-header">
        <div className="stack">
          <span className="eyebrow">Find food</span>
          <h1 className="display h1">Open near you</h1>
          <p className="text-2">Sorted by urgency: what expires first is at the top. Claim one and it's yours alone.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <form className="toolbar" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <div className="input-icon">
            <MapPin />
            <input className="input" placeholder="City, or leave empty for everywhere" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" />
          </div>
          <div className="segmented" role="radiogroup" aria-label="Food type">
            {[['', 'All'], ...Object.entries(FOOD_TYPES)].map(([v, label]) => (
              <button type="button" key={v || 'all'} className={foodType === v ? 'on' : ''} onClick={() => setFoodType(v)} aria-pressed={foodType === v}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" aria-label="Search"><RefreshCw /> Search</button>
        </form>
      </div>

      {!loading && listings.length > 0 && (
        <p className="text-2 small">
          <strong style={{ color: 'var(--text)' }}>{listings.length}</strong> listing{listings.length !== 1 && 's'} ·{' '}
          <strong style={{ color: 'var(--text)' }}>{totalServings.toLocaleString()}</strong> servings available
          {city.trim() && <> in <strong style={{ color: 'var(--text)' }}>{city.trim()}</strong></>}
        </p>
      )}

      {loading ? (
        <ListingSkeleton grid count={6} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing open right now"
          action={city.trim() && <button className="btn btn-secondary" onClick={() => { setCity(''); load(''); }}>Search all cities</button>}
        >
          No unclaimed food{city.trim() && ` in ${city.trim()}`} at the moment. New listings appear here as soon as donors post them.
        </EmptyState>
      ) : (
        <div className="listing-grid">
          {listings.map((l) => (
            <ListingCard key={l._id} listing={l}>
              <button className="btn btn-block" onClick={() => claim(l)} disabled={!!claiming}>
                {claiming === l._id ? <Spinner /> : <><HandHeart /> Claim {l.quantity} servings</>}
              </button>
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  );
}
