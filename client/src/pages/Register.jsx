import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Check, HandHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Alert, Spinner } from '../components/ui/Feedback.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';

function validate(f) {
  if (!['donor', 'ngo'].includes(f.role)) return 'Choose an account type.';
  if (f.name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (f.organization.trim().length < 2) return 'Organization name is required.';
  if (f.city.trim().length < 2) return 'City is required.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Please enter a valid email address.';
  const d = f.phone.replace(/\D/g, '');
  if (f.phone.trim() && (d.length < 10 || d.length > 15)) return 'Enter a valid WhatsApp number, e.g. +91 98765 43210.';
  if (f.password.length < 6) return 'Password must be at least 6 characters.';
  if (f.password !== f.confirm) return 'Passwords do not match.';
  return '';
}

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH = [['', 'var(--border)'], ['Weak', 'var(--danger)'], ['Okay', 'var(--accent)'], ['Good', 'var(--brand)'], ['Strong', 'var(--brand)']];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    role: params.get('role') === 'ngo' ? 'ngo' : 'donor',
    name: '', organization: '', city: '', email: '', phone: '', password: '', confirm: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const s = strength(form.password);
  const isDonor = form.role === 'donor';

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate(form);
    if (msg) return setError(msg);
    setError('');
    setBusy(true);
    try {
      const { confirm, ...fields } = form;
      await register(fields);
      toast.success(`Welcome to FoodBridge, ${form.name.split(' ')[0]}!`);
      navigate(isDonor ? '/listings/new' : '/browse', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      quote={isDonor ? 'Turn tonight\'s leftovers into tomorrow\'s impact.' : 'Never miss a pickup again.'}
      points={
        isDonor
          ? ['Post surplus in under a minute', 'Address shared only with the NGO that claims', 'See every meal you\'ve donated']
          : ['See open food in your city, live', 'Claim with one click, no double bookings', 'Release anytime if plans change']
      }
    >
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="display h1">Create your account</h1>
        <p className="text-2">Free for donors and NGOs. Takes two minutes.</p>
      </div>

      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert>{error}</Alert>

        <div className="field">
          <span className="field-label">I am…</span>
          <div className="role-cards" role="radiogroup">
            {[
              ['donor', Building2, 'A food donor', 'Restaurant, hotel, mess, caterer'],
              ['ngo', HandHeart, 'An NGO / shelter', 'I distribute food to people'],
            ].map(([value, Icon, title, sub]) => (
              <label key={value} className={`role-card ${form.role === value ? 'on' : ''}`}>
                <input type="radio" name="role" value={value} checked={form.role === value} onChange={onChange} />
                <span className="tick">{form.role === value && <Check />}</span>
                <span className="ic"><Icon /></span>
                <span>
                  <strong style={{ display: 'block', fontSize: '0.92rem' }}>{title}</strong>
                  <span className="muted xs">{sub}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="name">Your name</label>
            <input id="name" className="input" name="name" value={form.name} onChange={onChange} autoComplete="name" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="city">City</label>
            <input id="city" className="input" name="city" value={form.city} onChange={onChange} placeholder="e.g. Pune" />
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="org">{isDonor ? 'Business name' : 'Organization name'}</label>
          <input id="org" className="input" name="organization" value={form.organization} onChange={onChange}
            placeholder={isDonor ? 'e.g. Spice Garden Restaurant' : 'e.g. Annapurna Shelter'} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="email">Work email</label>
          <input id="email" className="input" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="phone">WhatsApp number <span className="muted xs">optional</span></label>
          <input id="phone" className="input" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={onChange}
            placeholder="+91 98765 43210" autoComplete="tel" />
          <span className="field-hint">Only shared with the {isDonor ? 'NGO that claims your food' : 'donor whose food you claim'}, so you can chat on WhatsApp.</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="password">
              Password {form.password && <span className="xs" style={{ color: STRENGTH[s][1] }}>{STRENGTH[s][0]}</span>}
            </label>
            <input id="password" className="input" name="password" type="password" value={form.password} onChange={onChange} autoComplete="new-password" />
            <div className="pw-meter">{[1, 2, 3, 4].map((i) => <i key={i} style={{ background: i <= s ? STRENGTH[s][1] : undefined }} />)}</div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" className="input" name="confirm" type="password" value={form.confirm} onChange={onChange} autoComplete="new-password" />
          </div>
        </div>

        <button className="btn btn-lg btn-block" disabled={busy}>
          {busy ? <Spinner /> : <>Create account <ArrowRight /></>}
        </button>
      </form>
      <p className="text-2 small" style={{ textAlign: 'center' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
