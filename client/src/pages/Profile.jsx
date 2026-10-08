import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, Save, ShieldCheck, Soup } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Alert, Spinner } from '../components/ui/Feedback.jsx';
import { prettyPhone } from '../components/WhatsApp.jsx';
import { initials } from '../utils/format.js';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const isDonor = user.role === 'donor';
  const [mine, setMine] = useState(null);
  const [form, setForm] = useState({
    name: user.name, organization: user.organization, city: user.city, phone: user.phone ? prettyPhone(user.phone) : '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/listings/mine').then(setMine).catch(() => setMine([]));
  }, []);

  const done = (mine || []).filter((l) => l.status === 'completed');
  const meals = done.reduce((s, l) => s + l.quantity, 0);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters.');
    if (form.organization.trim().length < 2) return setError('Organization name is required.');
    if (form.city.trim().length < 2) return setError('City is required.');
    const d = form.phone.replace(/\D/g, '');
    if (form.phone.trim() && (d.length < 10 || d.length > 15)) return setError('Enter a valid WhatsApp number, e.g. +91 98765 43210.');
    setError('');
    setBusy(true);
    try {
      const u = await updateProfile(form);
      setForm((f) => ({ ...f, phone: u.phone ? prettyPhone(u.phone) : '' }));
      toast.success('Profile saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container container-sm page">
      <div className="card card-lg" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 110, background: 'radial-gradient(120% 140% at 100% 0%, var(--hero-dark-2), var(--hero-dark) 60%)' }} />
        <div style={{ padding: '0 32px 32px', marginTop: -36 }} className="stack-lg">
          <span className="avatar lg" style={{ width: 76, height: 76, fontSize: '1.5rem', border: '4px solid var(--surface)' }}>
            {initials(user.organization)}
          </span>
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 6 }}>
              <h1 className="display h2">{user.organization}</h1>
              <div className="row">
                <span className={`badge ${isDonor ? 'claimed' : 'available'}`}>{isDonor ? 'Food donor' : 'NGO / distributor'}</span>
                <span className="muted small">{user.email}</span>
              </div>
            </div>
            <div className="stat-card" style={{ padding: 0, gap: 4, textAlign: 'right' }}>
              <div className="muted small row" style={{ gap: 6, justifyContent: 'flex-end' }}><Soup size={15} /> {isDonor ? 'Meals donated' : 'Meals received'}</div>
              <div className="val mono" style={{ fontSize: '2rem' }}>{mine ? meals.toLocaleString() : '…'}</div>
            </div>
          </div>

          <hr className="divider" />

          <form className="form" onSubmit={onSubmit} noValidate>
            <Alert>{error}</Alert>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="p-name">Contact person</label>
                <input id="p-name" className="input" name="name" value={form.name} onChange={onChange} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="p-city">City</label>
                <input id="p-city" className="input" name="city" value={form.city} onChange={onChange} />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="p-org">{isDonor ? 'Business name' : 'Organization name'}</label>
              <input id="p-org" className="input" name="organization" value={form.organization} onChange={onChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="p-phone">
                <span className="row" style={{ gap: 6 }}><MessageCircle size={15} /> WhatsApp number</span>
              </label>
              <input id="p-phone" className="input" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={onChange}
                placeholder="+91 98765 43210" autoComplete="tel" />
              <span className="field-hint row" style={{ gap: 6 }}>
                <ShieldCheck size={14} /> Only shared with the other side of a pickup, so you can chat on WhatsApp. Leave empty to remove.
              </span>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <Link to="/dashboard" className="btn btn-ghost"><LayoutDashboard /> Dashboard</Link>
              <button className="btn" disabled={busy}>{busy ? <Spinner /> : <><Save /> Save changes</>}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
