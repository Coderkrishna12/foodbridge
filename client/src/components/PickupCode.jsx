import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import OtpInput from './ui/OtpInput.jsx';
import { Spinner } from './ui/Feedback.jsx';

// NGO side: the code they show to the donor at pickup
export function PickupCodeCard({ code }) {
  return (
    <div className="code-card">
      <span className="eyebrow" style={{ color: '#f3c26b' }}>Your pickup code</span>
      <div className="code-digits" aria-label={`Pickup code ${code.split('').join(' ')}`}>
        {code.split('').map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <p className="small" style={{ color: 'rgba(255,255,255,0.75)' }}>
        Show this to the donor when you collect the food. They enter it to confirm the handover.
      </p>
    </div>
  );
}

// Compact version for listing cards
export const PickupCodeChip = ({ code }) => (
  <span className="code-chip" title="Show this code to the donor at pickup"><KeyRound size={13} /> Code {code}</span>
);

// Donor side: enter the NGO's code. `onVerify(code)` resolves to '' on success or an error message.
export function VerifyPickup({ onVerify }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) return setError('Enter all 4 digits.');
    setBusy(true);
    const msg = await onVerify(code);
    setBusy(false);
    if (msg) {
      setError(msg);
      setCode('');
    }
  };

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      <div className="stack" style={{ gap: 4 }}>
        <div className="row" style={{ gap: 8, fontWeight: 600 }}><KeyRound size={17} /> Verify pickup</div>
        <p className="muted small">Ask the NGO volunteer for their 4-digit code and enter it to hand over the food.</p>
      </div>
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} invalid={!!error} disabled={busy} />
      {error && <p className="small" role="alert" style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-lg btn-block" disabled={busy}>{busy ? <Spinner /> : 'Confirm handover'}</button>
    </form>
  );
}
