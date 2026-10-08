import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Eye, Minus, Plus, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Alert, FullPageLoader, Spinner } from '../components/ui/Feedback.jsx';
import ListingCard from '../components/ListingCard.jsx';
import PhotoUploader from '../components/PhotoUploader.jsx';
import { DIETARY, PACKAGING, PREPARATION } from '../utils/badges.js';
import { FOOD_TYPES, toLocalInput } from '../utils/format.js';

const MAX_DAYS = 7;
const QUICK = [[2, '+2 hours'], [4, '+4 hours'], [8, '+8 hours'], [24, 'Tomorrow']];

function validate(f) {
  if (f.title.trim().length < 3) return 'Give the food a title (at least 3 characters).';
  const q = Number(f.quantity);
  if (!Number.isInteger(q) || q < 1 || q > 5000) return 'Servings must be a whole number between 1 and 5000.';
  if (f.pickupAddress.trim().length < 5) return 'Please enter the full pickup address.';
  if (f.city.trim().length < 2) return 'City is required.';
  const exp = new Date(f.expiresAt);
  if (!f.expiresAt || Number.isNaN(exp.getTime())) return 'Please set a best-before time.';
  if (exp <= new Date()) return 'Best-before time must be in the future.';
  if (exp - Date.now() > MAX_DAYS * 864e5) return `Best-before can be at most ${MAX_DAYS} days away.`;
  return '';
}

// Create (/listings/new) and Update (/listings/:id/edit)
export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', foodType: 'veg', quantity: 20, pickupAddress: '', city: user.city,
    expiresAt: toLocalInput(Date.now() + 4 * 3600e3),
    images: [], packaging: null, preparation: [], dietary: [],
  });
  const [createdAt, setCreatedAt] = useState(null);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api(`/listings/${id}`)
      .then((l) => {
        if (l.status !== 'available') setLocked(`This listing is ${l.status} and can no longer be edited.`);
        setCreatedAt(l.createdAt);
        setForm({
          title: l.title, description: l.description, foodType: l.foodType, quantity: l.quantity,
          pickupAddress: l.pickupAddress || '', city: l.city,
          images: l.images || [], packaging: l.packaging || null, preparation: l.preparation || [], dietary: l.dietary || [],
          // expired listings get a fresh default so "Extend" is one click
          expiresAt: toLocalInput(l.isExpired ? Date.now() + 4 * 3600e3 : l.expiresAt),
        });
      })
      .catch((err) => setLocked(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onChange = (e) => set(e.target.name, e.target.value);
  const toggle = (key, value) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
  const setImages = (updater) => setForm((f) => ({ ...f, images: updater(f.images) }));
  const bump = (d) => set('quantity', Math.min(5000, Math.max(1, (parseInt(form.quantity, 10) || 0) + d)));

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate(form);
    if (msg) return setError(msg);
    setError('');
    setBusy(true);
    try {
      const body = { ...form, quantity: Number(form.quantity), expiresAt: new Date(form.expiresAt).toISOString() };
      const listing = await api(isEdit ? `/listings/${id}` : '/listings', { method: isEdit ? 'PUT' : 'POST', body });
      toast.success(isEdit ? 'Listing updated.' : 'Posted! Nearby NGOs can see it now.');
      navigate(`/listings/${listing._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading) return <FullPageLoader />;

  // Shape the form like a listing for the live preview
  const preview = {
    ...form,
    quantity: parseInt(form.quantity, 10) || 0,
    status: 'available',
    createdAt: createdAt || new Date().toISOString(),
    expiresAt: new Date(form.expiresAt || Date.now()).toISOString(),
    donor: { organization: user.organization },
  };

  return (
    <div className="container page">
      <div className="page-header">
        <div className="stack">
          <nav className="crumbs"><Link to="/dashboard">Dashboard</Link><ChevronRight />{isEdit ? 'Edit listing' : 'New listing'}</nav>
          <h1 className="display h1">{isEdit ? 'Edit listing' : 'Post surplus food'}</h1>
          <p className="text-2">{isEdit ? 'Changes are visible to NGOs immediately.' : 'Takes under a minute. NGOs in your city will see it instantly.'}</p>
        </div>
      </div>

      {locked ? (
        <Alert type="warn">{locked}</Alert>
      ) : (
        <div className="detail-grid">
          <form className="card card-lg form" onSubmit={onSubmit} noValidate>
            <Alert>{error}</Alert>

            <Section n="1" title="The food">
              <div className="field">
                <label className="field-label" htmlFor="title">What is it?</label>
                <input id="title" className="input" name="title" value={form.title} onChange={onChange} maxLength={100} placeholder="e.g. Veg biryani & dal" autoFocus />
              </div>
              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Type</span>
                  <div className="segmented full" role="radiogroup">
                    {Object.entries(FOOD_TYPES).map(([v, l]) => (
                      <button type="button" key={v} className={form.foodType === v ? 'on' : ''} onClick={() => set('foodType', v)} aria-pressed={form.foodType === v}>
                        <span className={`tag ${v}`} style={{ border: 0, padding: 0, height: 'auto', background: 'none' }}><i className="sq" /></span>{l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="qty">Servings</label>
                  <div className="stepper">
                    <button type="button" onClick={() => bump(-5)} aria-label="Decrease"><Minus /></button>
                    <input id="qty" name="quantity" type="number" min="1" max="5000" value={form.quantity} onChange={onChange} />
                    <button type="button" onClick={() => bump(5)} aria-label="Increase"><Plus /></button>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="desc">
                  Notes for the NGO <span className="muted xs">{form.description.length}/500</span>
                </label>
                <textarea id="desc" className="textarea" name="description" rows="3" value={form.description} onChange={onChange} maxLength={500}
                  placeholder="Packaging, allergens, who to ask for at the counter…" />
              </div>
            </Section>

            <hr className="divider" />

            <Section n="2" title="Photos" hint="Optional, up to 4. Listings with photos get claimed faster.">
              <PhotoUploader images={form.images} setImages={setImages} onError={(m) => toast.error(m)} />
            </Section>

            <hr className="divider" />

            <Section n="3" title="Packaging & preparation" hint="Helps NGOs know what to bring and who can eat it.">
              <div className="field">
                <span className="field-label">Packaging</span>
                <div className="row" role="radiogroup" aria-label="Packaging">
                  {Object.entries(PACKAGING).map(([k, { label, icon: Icon }]) => (
                    <button type="button" key={k} className={`chip ${form.packaging === k ? 'on' : ''}`} aria-pressed={form.packaging === k}
                      onClick={() => set('packaging', form.packaging === k ? null : k)}>
                      <Icon /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="field-label">Preparation <span className="muted xs">select all that apply</span></span>
                <div className="row">
                  {Object.entries(PREPARATION).map(([k, { label, icon: Icon }]) => (
                    <button type="button" key={k} className={`chip ${form.preparation.includes(k) ? 'on' : ''}`} aria-pressed={form.preparation.includes(k)}
                      onClick={() => toggle('preparation', k)}>
                      <Icon /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="field-label">Dietary & allergens <span className="muted xs">select all that apply</span></span>
                <div className="row">
                  {Object.entries(DIETARY).map(([k, { label, icon: Icon }]) => (
                    <button type="button" key={k} className={`chip ${form.dietary.includes(k) ? 'on' : ''}`} aria-pressed={form.dietary.includes(k)}
                      onClick={() => toggle('dietary', k)}>
                      <Icon /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <hr className="divider" />

            <Section n="4" title="Pickup">
              <div className="field">
                <label className="field-label" htmlFor="addr">Pickup address</label>
                <input id="addr" className="input" name="pickupAddress" value={form.pickupAddress} onChange={onChange} maxLength={200} placeholder="Building, street, landmark" />
                <span className="field-hint row" style={{ gap: 6 }}><ShieldCheck size={14} /> Only shown to the NGO that claims this listing.</span>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="city">City</label>
                <input id="city" className="input" name="city" value={form.city} onChange={onChange} />
              </div>
            </Section>

            <hr className="divider" />

            <Section n="5" title="Best before">
              <div className="row">
                {QUICK.map(([h, label]) => (
                  <button type="button" key={h} className="chip" onClick={() => set('expiresAt', toLocalInput(Date.now() + h * 3600e3))}>{label}</button>
                ))}
              </div>
              <div className="field">
                <input className="input" name="expiresAt" type="datetime-local" value={form.expiresAt} onChange={onChange} aria-label="Best before" />
                <span className="field-hint">After this time the listing can't be claimed. Max {MAX_DAYS} days.</span>
              </div>
            </Section>

            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <Link to="/dashboard" className="btn btn-ghost">Cancel</Link>
              <button className="btn btn-lg" disabled={busy}>
                {busy ? <Spinner /> : isEdit ? 'Save changes' : 'Post listing'}
              </button>
            </div>
          </form>

          <aside className="sticky hide-sm">
            <div className="preview-label"><Eye /> Live preview</div>
            <ListingCard listing={preview} preview />
            <p className="muted xs" style={{ marginTop: 12 }}>This is how NGOs will see your listing in their feed.</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ n, title, hint, children }) {
  return (
    <div className="stack-lg">
      <div className="row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <span className="avatar" style={{ width: 26, height: 26, fontSize: '0.75rem', background: 'var(--surface-2)', color: 'var(--text-2)' }}>{n}</span>
        <div>
          <h2 className="h3">{title}</h2>
          {hint && <p className="muted small" style={{ marginTop: 2 }}>{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
