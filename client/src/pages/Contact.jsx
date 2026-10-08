import { useState } from 'react';
import { CircleCheck, Clock, Mail, MessageSquare, Send } from 'lucide-react';
import { Alert } from '../components/ui/Feedback.jsx';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'general', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return setError('Please fill in all fields.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.message.trim().length < 10) return setError('Message should be at least 10 characters.');
    setError('');
    setSent(true);
  };

  return (
    <section className="container page" style={{ paddingTop: 72 }}>
      <div className="grid cols-2" style={{ gap: 56, alignItems: 'start' }}>
        <div className="stack-lg">
          <span className="eyebrow">Contact</span>
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 5vw, 4rem)' }}>Let's <em>talk</em>.</h1>
          <p className="lead">
            Want to onboard your restaurant chain, partner as an NGO, or just have feedback? We read every message.
          </p>
          <div className="stack" style={{ gap: 14, marginTop: 12 }}>
            {[
              [Mail, 'Email', 'hello@foodbridge.example'],
              [Clock, 'Response time', 'Within one working day'],
              [MessageSquare, 'Partnerships', 'NGOs, CSR teams and city programs welcome'],
            ].map(([Icon, k, v]) => (
              <div key={k} className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
                <div className="feature-icon" style={{ margin: 0, flexShrink: 0 }}><Icon /></div>
                <div>
                  <div className="small muted">{k}</div>
                  <div style={{ fontWeight: 550 }}>{v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-lg">
          {sent ? (
            <div className="stack-lg" style={{ alignItems: 'center', textAlign: 'center', padding: '32px 0' }}>
              <div className="feature-icon" style={{ width: 56, height: 56, margin: 0 }}><CircleCheck /></div>
              <h2 className="h3" style={{ fontSize: '1.4rem' }}>Thanks, {form.name.split(' ')[0]}!</h2>
              <p className="text-2">Your message is in. We'll reply to {form.email} soon.</p>
              <button className="btn btn-secondary" onClick={() => { setSent(false); setForm({ name: '', email: '', topic: 'general', message: '' }); }}>
                Send another
              </button>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit} noValidate>
              <Alert>{error}</Alert>
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="c-name">Name</label>
                  <input id="c-name" className="input" name="name" value={form.name} onChange={onChange} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="c-email">Email</label>
                  <input id="c-email" className="input" name="email" type="email" value={form.email} onChange={onChange} />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c-topic">Topic</label>
                <select id="c-topic" className="select" name="topic" value={form.topic} onChange={onChange}>
                  <option value="general">General question</option>
                  <option value="donor">Onboarding as a donor</option>
                  <option value="ngo">Partnering as an NGO</option>
                  <option value="feedback">Product feedback</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c-msg">Message</label>
                <textarea id="c-msg" className="textarea" name="message" rows="5" value={form.message} onChange={onChange} />
              </div>
              <button className="btn btn-lg btn-block"><Send /> Send message</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
