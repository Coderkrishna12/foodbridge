import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleCheck, Clock, HandHeart, Inbox, KeyRound, Package, Pencil, Plus, Search, Soup, Trash2, Truck, Undo2,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useConfirm } from '../components/ui/Confirm.jsx';
import { EmptyState, ListingSkeleton } from '../components/ui/Feedback.jsx';
import ListingCard from '../components/ListingCard.jsx';
import useNow from '../hooks/useNow.js';
import { displayStatus, greeting } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const now = useNow();
  const isDonor = user.role === 'donor';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api('/listings/mine')
      .then(setListings)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drop = (id) => setListings((ls) => ls.filter((l) => l._id !== id));
  const release = async (l) => {
    if (!(await confirm({ title: 'Release this claim?', message: 'The listing becomes available to other NGOs right away.', confirmText: 'Release', danger: true }))) return;
    try {
      await api(`/listings/${l._id}/release`, { method: 'POST' });
      drop(l._id);
      toast.info('Claim released.');
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (l) => {
    if (!(await confirm({ title: 'Delete listing?', message: `"${l.title}" will be permanently removed.`, confirmText: 'Delete', danger: true }))) return;
    try {
      await api(`/listings/${l._id}`, { method: 'DELETE' });
      drop(l._id);
      toast.success('Listing deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const counts = useMemo(() => {
    const c = { all: listings.length, available: 0, claimed: 0, completed: 0, expired: 0 };
    listings.forEach((l) => c[displayStatus(l, now)]++);
    return c;
  }, [listings, now]);
  const meals = listings.filter((l) => l.status === 'completed').reduce((s, l) => s + l.quantity, 0);
  const tabs = isDonor ? ['all', 'available', 'claimed', 'completed', 'expired'] : ['all', 'claimed', 'completed'];
  const visible = tab === 'all' ? listings : listings.filter((l) => displayStatus(l, now) === tab);

  return (
    <div className="container page">
      <div className="page-header">
        <div className="stack">
          <span className="eyebrow">{isDonor ? 'Donor dashboard' : 'NGO dashboard'}</span>
          <h1 className="display h1">{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="text-2">{user.organization} · {user.city}</p>
        </div>
        {isDonor ? (
          <Link to="/listings/new" className="btn btn-lg"><Plus /> Post surplus food</Link>
        ) : (
          <Link to="/browse" className="btn btn-lg"><Search /> Find food nearby</Link>
        )}
      </div>

      <div className="grid cols-4">
        {isDonor ? (
          <>
            <Stat icon={Soup} label="Meals donated" value={meals} hl />
            <Stat icon={Package} label="Open listings" value={counts.available} />
            <Stat icon={Clock} label="Awaiting pickup" value={counts.claimed} />
            <Stat icon={CircleCheck} label="Completed" value={counts.completed} />
          </>
        ) : (
          <>
            <Stat icon={Soup} label="Meals received" value={meals} hl />
            <Stat icon={Truck} label="Pickups pending" value={counts.claimed} />
            <Stat icon={CircleCheck} label="Pickups done" value={counts.completed} />
            <Stat icon={HandHeart} label="Total claims" value={counts.all} />
          </>
        )}
      </div>

      <div className="stack-lg">
        <div className="row between">
          <h2 className="h3" style={{ fontSize: '1.2rem' }}>{isDonor ? 'Your listings' : 'Your pickups'}</h2>
          <div className="segmented" role="tablist">
            {tabs.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
                {t[0].toUpperCase() + t.slice(1)} <span className="count">{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <ListingSkeleton grid count={3} />
        ) : visible.length === 0 ? (
          listings.length === 0 ? (
            isDonor ? (
              <EmptyState icon={Package} title="No listings yet" action={<Link to="/listings/new" className="btn"><Plus /> Post your first listing</Link>}>
                Got food left over today? Post it in under a minute and nearby NGOs will see it instantly.
              </EmptyState>
            ) : (
              <EmptyState icon={HandHeart} title="No pickups yet" action={<Link to="/browse" className="btn"><Search /> Browse open listings</Link>}>
                Claim surplus food from kitchens near you. It will show up here until it's picked up.
              </EmptyState>
            )
          ) : (
            <EmptyState icon={Inbox} title={`Nothing ${tab} right now`}>Try another tab.</EmptyState>
          )
        ) : (
          <div className="listing-grid">
            {visible.map((l) => {
              const s = displayStatus(l, now);
              return (
                <ListingCard key={l._id} listing={l} showDonor={!isDonor}>
                  {isDonor && s === 'claimed' && <Link to={`/listings/${l._id}`} className="btn btn-sm"><KeyRound /> Enter pickup code</Link>}
                  {!isDonor && s === 'claimed' && <Link to={`/listings/${l._id}`} className="btn btn-sm"><KeyRound /> Show code</Link>}
                  {!isDonor && s === 'claimed' && <button className="btn btn-secondary btn-sm" onClick={() => release(l)}><Undo2 /> Release</button>}
                  {isDonor && (s === 'available' || s === 'expired') && (
                    <Link to={`/listings/${l._id}/edit`} className="btn btn-secondary btn-sm"><Pencil /> {s === 'expired' ? 'Extend' : 'Edit'}</Link>
                  )}
                  {isDonor && s !== 'claimed' && <button className="btn btn-danger btn-sm" onClick={() => remove(l)} aria-label="Delete"><Trash2 /></button>}
                </ListingCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hl }) {
  return (
    <div className={`card stat-card ${hl ? 'hl' : ''}`}>
      <div className="top">{label}<span className="ic"><Icon /></span></div>
      <div className="val mono">{value.toLocaleString()}</div>
    </div>
  );
}
