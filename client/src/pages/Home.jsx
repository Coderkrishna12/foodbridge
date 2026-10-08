import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Building2, Check, CircleCheck, Clock, HandHeart, Lock, MapPin, Package, ShieldCheck,
  Soup, Truck, Users, Zap,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useCountUp from '../hooks/useCountUp.js';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/stats').then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <>
      <Hero user={user} />

      <section className="container">
        <div className="metrics reveal d2">
          <Metric value={stats?.mealsSaved} label="Meals rescued" />
          <Metric value={stats?.activeListings} label="Listings open right now" />
          <Metric value={stats?.donors} label="Donor kitchens" />
          <Metric value={stats?.ngos} label="NGOs & shelters" />
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">The problem</span>
          <h2 className="display h2">The food exists. <em>The coordination doesn't.</em></h2>
          <p className="lead">
            Surplus isn't the hard part. It's spread across thousands of kitchens, it spoils in hours, and nobody
            has a live view of what's available right now.
          </p>
        </div>
        <div className="grid cols-3">
          {[
            ['01', 'Food expires fast', 'Cooked food has a window of a few hours. A chain of phone calls and WhatsApp forwards eats that window.'],
            ['02', 'Nobody knows who\'s coming', 'Two NGOs drive across the city for the same pickup, or no one shows up at all.'],
            ['03', 'Donors never see impact', 'Without confirmation that food reached people, many kitchens just stop trying.'],
          ].map(([n, t, d]) => (
            <div key={n} className="card card-lg">
              <div className="problem-num">{n}</div>
              <h3 className="h3" style={{ marginBottom: 10 }}>{t}</h3>
              <p className="text-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head center">
          <span className="eyebrow">How it works</span>
          <h2 className="display h2">One listing. One claim. <em>One pickup.</em></h2>
        </div>
        <div className="steps">
          {[
            [Package, 'Donor posts', 'What it is, how many servings, where, and a best-before time.'],
            [MapPin, 'NGOs see it live', 'Open listings in their city, sorted by what expires first.'],
            [Lock, 'One NGO claims', 'The claim is atomic. The listing locks so nobody else heads there.'],
            [Truck, 'Verified handover', 'The NGO shows a 4-digit code; the donor enters it to confirm pickup. Meals are counted.'],
          ].map(([Icon, t, d]) => (
            <div key={t} className="step">
              <div className="step-dot"><Icon /></div>
              <div>
                <h3>{t}</h3>
                <p className="text-2 small">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="eyebrow">Built for both sides</span>
          <h2 className="display h2">Less waste for kitchens. <em>More meals for shelters.</em></h2>
        </div>
        <div className="audience">
          <div className="card">
            <div className="feature-icon amber"><Building2 /></div>
            <div className="stack" style={{ gap: 8 }}>
              <h3 className="h3">For restaurants, hotels & caterers</h3>
              <p className="text-2">Post what's left in under a minute. See exactly who's coming, and when it's done.</p>
            </div>
            <ul className="check-list">
              <li><Check /> Live preview of your listing before you post</li>
              <li><Check /> Your address is only shared with the NGO that claims</li>
              <li><Check /> Hand over only after verifying the NGO's 4-digit code</li>
            </ul>
            <Link to="/register?role=donor" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Join as a donor <ArrowRight />
            </Link>
          </div>
          <div className="card">
            <div className="feature-icon"><HandHeart /></div>
            <div className="stack" style={{ gap: 8 }}>
              <h3 className="h3">For NGOs, shelters & community kitchens</h3>
              <p className="text-2">See every open listing in your city, most urgent first, and claim it with one click.</p>
            </div>
            <ul className="check-list">
              <li><Check /> Guaranteed: no other NGO is assigned to your pickup</li>
              <li><Check /> Filter by city and veg / non-veg</li>
              <li><Check /> Release a claim if plans change</li>
            </ul>
            <Link to="/register?role=ngo" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Join as an NGO <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="grid cols-3">
          {[
            [Zap, 'Race-safe claims', 'If two NGOs tap Claim at the same instant, exactly one wins. Enforced in the database.'],
            [ShieldCheck, 'Private by default', 'Exact pickup addresses are hidden until a listing is claimed.'],
            [BarChart3, 'Impact you can see', 'Every completed pickup adds to live, public meal counts.'],
          ].map(([Icon, t, d], i) => (
            <div key={t} className="card">
              <div className={`feature-icon ${['', 'blue', 'amber'][i]}`}><Icon /></div>
              <h3 className="h3" style={{ marginBottom: 8 }}>{t}</h3>
              <p className="text-2 small">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="cta-band">
          <div className="stack" style={{ gap: 12, maxWidth: 520 }}>
            <h2 className="display h2">Tonight's surplus could be someone's dinner.</h2>
            <p>Free for donors and NGOs. Set up in two minutes.</p>
          </div>
          <div className="row">
            {user ? (
              <Link to="/dashboard" className="btn btn-light btn-lg">Open dashboard <ArrowRight /></Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-light btn-lg">Get started <ArrowRight /></Link>
                <Link to="/how-it-works" className="btn btn-outline-light btn-lg">Learn more</Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Hero({ user }) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="stack-lg">
          <span className="eyebrow reveal">Surplus food → people who need it</span>
          <h1 className="display reveal d1">
            Good food shouldn't <em>end up</em> in the bin.
          </h1>
          <p className="lead reveal d2">
            FoodBridge connects restaurants, hostels and caterers with nearby NGOs and shelters, so surplus meals are
            claimed and picked up before they expire.
          </p>
          <div className="row reveal d3" style={{ gap: 12 }}>
            {user ? (
              <Link to={user.role === 'donor' ? '/listings/new' : '/browse'} className="btn btn-lg">
                {user.role === 'donor' ? 'Post surplus food' : 'Find food nearby'} <ArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/register?role=donor" className="btn btn-lg">I have surplus food <ArrowRight /></Link>
                <Link to="/register?role=ngo" className="btn btn-secondary btn-lg">I run an NGO</Link>
              </>
            )}
          </div>
          <div className="hero-proof reveal d4">
            <span className="row" style={{ gap: 6 }}><CircleCheck size={16} /> Free for everyone</span>
            <span className="row" style={{ gap: 6 }}><CircleCheck size={16} /> Works on any phone</span>
            <span className="row hide-sm" style={{ gap: 6 }}><CircleCheck size={16} /> No double pickups</span>
          </div>
        </div>
        <HeroMock />
      </div>
    </section>
  );
}

// Decorative product preview (illustrative sample content, not live data)
function HeroMock() {
  const items = [
    ['Veg biryani & dal', '40 servings', '1h 20m left', 'var(--danger)', 'var(--danger-soft)', 'crit', 18],
    ['Paneer curry + rotis', '25 servings', '4h 05m left', 'var(--accent-text)', 'var(--accent-soft)', 'warn', 52],
    ['Wedding buffet surplus', '120 servings', '9h 40m left', 'var(--brand-text)', 'var(--brand-soft)', 'ok', 86],
  ];
  return (
    <div className="reveal d2" style={{ position: 'relative' }} aria-hidden="true">
      <div className="mock">
        <div className="mock-head">
          <div className="mock-dots"><i /><i /><i /></div>
          <span className="xs muted row" style={{ gap: 6 }}><span className="badge available" style={{ height: 20 }}>Live</span> Open near you</span>
        </div>
        {items.map(([t, q, left, c, bg, u, pct]) => (
          <div key={t} className="mock-item">
            <div className="mock-thumb" style={{ background: bg, color: c }}><Soup /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{t}</div>
              <div className="xs muted row" style={{ gap: 10, marginTop: 2 }}>
                <span>{q}</span><span className="row" style={{ gap: 4 }}><Clock size={12} /> {left}</span>
              </div>
              <div className={`countdown ${u}`} style={{ marginTop: 8 }}>
                <div className="bar" style={{ height: 4 }}><i style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
            <span className="btn btn-sm" style={{ pointerEvents: 'none' }}>Claim</span>
          </div>
        ))}
      </div>
      <div className="mock-float">
        <div className="ok"><Check /></div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Claimed by a shelter nearby</div>
          <div className="xs muted row" style={{ gap: 4 }}><Users size={12} /> Pickup in 25 min</div>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  const n = useCountUp(value);
  return (
    <div className="metric">
      <div className="metric-value mono">{value == null ? '—' : n.toLocaleString()}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
