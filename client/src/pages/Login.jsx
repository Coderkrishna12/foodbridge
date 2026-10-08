import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Alert, Spinner } from '../components/ui/Feedback.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError('Please enter your email and password.');
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      quote="Every pickup is a meal that didn't go to waste."
      points={['Live listings, sorted by urgency', 'One claim per listing, guaranteed', 'Your impact, counted automatically']}
    >
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="display h1">Welcome back</h1>
        <p className="text-2">Log in to your FoodBridge account.</p>
      </div>
      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert>{error}</Alert>
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <div className="input-icon">
            <Mail />
            <input id="email" className="input" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" autoFocus />
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="password">Password</label>
          <div className="input-icon">
            <Lock />
            <input id="password" className="input" name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={onChange} autoComplete="current-password" style={{ paddingRight: 44 }} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>
        <button className="btn btn-lg btn-block" disabled={busy}>
          {busy ? <Spinner /> : <>Log in <ArrowRight /></>}
        </button>
      </form>
      <p className="text-2 small" style={{ textAlign: 'center' }}>
        New to FoodBridge? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
