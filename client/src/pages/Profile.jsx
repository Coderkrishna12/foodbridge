import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, LayoutDashboard, Mail, MapPin, Soup } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';

export default function Profile() {
  const { user } = useAuth();
  const isDonor = user.role === 'donor';
  const [mine, setMine] = useState(null);

  useEffect(() => {
    api('/listings/mine').then(setMine).catch(() => setMine([]));
  }, []);

  const done = (mine || []).filter((l) => l.status === 'completed');
  const meals = done.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="container container-sm page">
      <div className="card card-lg" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 110, background: 'radial-gradient(120% 140% at 100% 0%, var(--hero-dark-2), var(--hero-dark) 60%)' }} />
        <div style={{ padding: '0 32px 32px', marginTop: -36 }} className="stack-lg">
          <span className="avatar lg" style={{ width: 76, height: 76, fontSize: '1.5rem', border: '4px solid var(--surface)' }}>
            {initials(user.organization)}
          </span>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="display h2">{user.organization}</h1>
            <div className="row">
              <span className={`badge ${isDonor ? 'claimed' : 'available'}`}>{isDonor ? 'Food donor' : 'NGO / distributor'}</span>
            </div>
          </div>
          <div className="info-grid">
            <Row icon={Building2} k="Contact person" v={user.name} />
            <Row icon={Mail} k="Email" v={user.email} />
            <Row icon={MapPin} k="City" v={user.city} />
            <Row icon={Soup} k={isDonor ? 'Meals donated' : 'Meals received'} v={mine ? `${meals.toLocaleString()} across ${done.length} pickup${done.length !== 1 ? 's' : ''}` : '…'} />
          </div>
          <Link to="/dashboard" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}><LayoutDashboard /> Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}

const Row = ({ icon: Icon, k, v }) => (
  <div>
    <span className="ic"><Icon /></span>
    <div style={{ minWidth: 0 }}><div className="k">{k}</div><div className="v" style={{ overflowWrap: 'anywhere' }}>{v}</div></div>
  </div>
);
