import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarClock, Check, ChevronRight, CircleCheck, HandHeart, Lock, MapPin, Package, Pencil, SearchX, Trash2, Truck,
  Undo2, Users, Utensils,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useConfirm } from '../components/ui/Confirm.jsx';
import { EmptyState, FullPageLoader, Spinner } from '../components/ui/Feedback.jsx';
import { Countdown, FoodTag, StatusBadge } from '../components/ListingBits.jsx';
import useNow from '../hooks/useNow.js';
import { FOOD_TYPES, displayStatus, fmtDateTime, initials } from '../utils/format.js';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const now = useNow();
  const [l, setListing] = useState(null);
  const [notFound, setNotFound] = useState('');
  const [busy, setBusy] = useState('');

  const reload = () => api(`/listings/${id}`).then(setListing).catch((err) => setNotFound(err.message));
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async (action, success, confirmOpts) => {
    if (confirmOpts && !(await confirm(confirmOpts))) return;
    setBusy(action);
    try {
      setListing(await api(`/listings/${id}/${action}`, { method: 'POST' }));
      toast.success(success);
    } catch (err) {
      toast.error(err.message);
      reload();
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: 'Delete listing?', message: `"${l.title}" will be permanently removed.`, confirmText: 'Delete', danger: true }))) return;
    try {
      await api(`/listings/${id}`, { method: 'DELETE' });
      toast.success('Listing deleted.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (notFound) {
    return (
      <div className="container page">
        <EmptyState icon={SearchX} title="Listing not found" action={<Link to="/dashboard" className="btn">Back to dashboard</Link>}>
          {notFound}
        </EmptyState>
      </div>
    );
  }
  if (!l) return <FullPageLoader />;
  document.title = `${l.title} · FoodBridge`;

  const status = displayStatus(l, now);
  const isOwner = l.donor?._id === user.id;
  const isClaimer = l.claimedBy?._id === user.id;
  const canSeeAddress = isOwner || isClaimer;
  const back = user.role === 'ngo' && !isClaimer ? ['/browse', 'Find food'] : ['/dashboard', 'Dashboard'];

  return (
    <div className="container page">
      <nav className="crumbs"><Link to={back[0]}>{back[1]}</Link><ChevronRight /><span>{l.title}</span></nav>

      <div className="detail-grid">
        <div className="stack-lg">
          <div className="card card-lg stack-lg">
            <div className="row" style={{ gap: 6 }}>
              <StatusBadge status={status} />
              <FoodTag type={l.foodType} />
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <h1 className="display h1">{l.title}</h1>
              {l.description ? <p className="text-2" style={{ fontSize: '1.02rem' }}>{l.description}</p> : <p className="muted">No extra notes from the donor.</p>}
            </div>
            {status === 'available' && <Countdown listing={l} now={now} />}

            <div className="info-grid">
              <Info icon={Users} k="Servings" v={l.quantity.toLocaleString()} />
              <Info icon={Utensils} k="Food type" v={FOOD_TYPES[l.foodType]} />
              <Info icon={CalendarClock} k="Best before" v={fmtDateTime(l.expiresAt)} />
              <Info icon={MapPin} k="City" v={l.city} />
            </div>

            <div className={`address-card ${canSeeAddress ? 'unlocked' : ''}`}>
              <span className="ic">{canSeeAddress ? <MapPin /> : <Lock />}</span>
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 600 }}>{canSeeAddress ? 'Pickup address' : 'Pickup address hidden'}</div>
                {canSeeAddress ? (
                  <div className="text-2">{l.pickupAddress}, {l.city}</div>
                ) : (
                  <div className="muted small">For the donor's privacy, the exact address is shown only to the NGO that claims this listing.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="stack-lg sticky">
          <Actions
            {...{ user, status, isOwner, isClaimer, busy, id, l }}
            onClaim={() => run('claim', `Claimed! The pickup address is now visible to you.`)}
            onComplete={() => run('complete', `${l.quantity} meals rescued. Thank you!`, { title: 'Confirm pickup?', message: 'This marks the food as collected and adds it to the impact count.', confirmText: 'Mark picked up' })}
            onRelease={() => run('release', 'Claim released.', { title: 'Release this claim?', message: 'Other NGOs will be able to claim it immediately.', confirmText: 'Release', danger: true })}
            onDelete={remove}
          />

          <div className="card stack-lg">
            <h3 className="h3">Progress</h3>
            <ol className="timeline">
              <Step done icon={Package} t="Posted" s={fmtDateTime(l.createdAt)} />
              <Step done={!!l.claimedAt} current={status === 'available'} icon={HandHeart}
                t={l.claimedBy ? `Claimed by ${l.claimedBy.organization}` : status === 'expired' ? 'Expired before claim' : 'Waiting for an NGO'}
                s={l.claimedAt ? fmtDateTime(l.claimedAt) : status === 'available' ? 'Visible to NGOs now' : ''} />
              <Step done={status === 'completed'} current={status === 'claimed'} icon={Truck}
                t={status === 'completed' ? 'Picked up' : 'Pickup'} s={l.completedAt ? fmtDateTime(l.completedAt) : status === 'claimed' ? 'On the way' : ''} />
            </ol>
          </div>

          <div className="card stack" style={{ gap: 16 }}>
            <Org label="Donor" org={l.donor} />
            {l.claimedBy && <><hr className="divider" /><Org label="NGO" org={l.claimedBy} /></>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Actions({ user, status, isOwner, isClaimer, busy, id, onClaim, onComplete, onRelease, onDelete }) {
  const items = [];
  if (user.role === 'ngo' && status === 'available') {
    items.push(<button key="c" className="btn btn-lg btn-block" disabled={!!busy} onClick={onClaim}>{busy === 'claim' ? <Spinner /> : <><HandHeart /> Claim this food</>}</button>);
  }
  if ((isOwner || isClaimer) && status === 'claimed') {
    items.push(<button key="p" className="btn btn-lg btn-block" disabled={!!busy} onClick={onComplete}>{busy === 'complete' ? <Spinner /> : <><Truck /> Mark picked up</>}</button>);
  }
  if (isClaimer && status === 'claimed') {
    items.push(<button key="r" className="btn btn-secondary btn-block" disabled={!!busy} onClick={onRelease}><Undo2 /> Release claim</button>);
  }
  if (isOwner && (status === 'available' || status === 'expired')) {
    items.push(<Link key="e" to={`/listings/${id}/edit`} className="btn btn-secondary btn-block"><Pencil /> {status === 'expired' ? 'Extend best-before' : 'Edit listing'}</Link>);
  }
  if (isOwner && status !== 'claimed') {
    items.push(<button key="d" className="btn btn-danger btn-block" onClick={onDelete}><Trash2 /> Delete</button>);
  }

  let note = null;
  if (status === 'completed') note = <><CircleCheck size={16} /> This food reached people. Thank you!</>;
  else if (status === 'claimed' && !isOwner && !isClaimer) note = <>Another NGO has claimed this listing.</>;
  else if (status === 'expired' && !isOwner) note = <>This listing expired before it was claimed.</>;
  else if (isOwner && status === 'claimed') note = <>Locked while an NGO is on the way.</>;

  if (!items.length && !note) return null;
  return (
    <div className="card stack" style={{ gap: 10 }}>
      {items}
      {note && <p className="small text-2 row" style={{ gap: 6, justifyContent: 'center', textAlign: 'center' }}>{note}</p>}
    </div>
  );
}

const Info = ({ icon: Icon, k, v }) => (
  <div>
    <span className="ic"><Icon /></span>
    <div><div className="k">{k}</div><div className="v">{v}</div></div>
  </div>
);

const Step = ({ done, current, icon: Icon, t, s }) => (
  <li className={done ? 'done' : current ? 'current' : ''}>
    <span className="dot">{done ? <Check /> : <Icon />}</span>
    <div><div className="t">{t}</div>{s && <div className="s">{s}</div>}</div>
  </li>
);

const Org = ({ label, org }) => (
  <div className="org">
    <span className="avatar">{initials(org?.organization)}</span>
    <div style={{ minWidth: 0 }}>
      <div className="xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{org?.organization}</div>
      <div className="muted small">{org?.name} · {org?.city}</div>
    </div>
  </div>
);
