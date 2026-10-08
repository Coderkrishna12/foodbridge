import { Link } from 'react-router-dom';
import { ArrowRight, Eye, HeartHandshake, Leaf, ShieldCheck } from 'lucide-react';
import { initials } from '../utils/format.js';

// Edit these with your team's real names and roles
const TEAM = [
  ['Team Member 1', 'Project lead & product'],
  ['Team Member 2', 'UI/UX design'],
  ['Team Member 3', 'Frontend (React)'],
  ['Team Member 4', 'Backend (Node / Express)'],
  ['Team Member 5', 'Database & testing'],
];

export default function About() {
  return (
    <>
      <section className="container page" style={{ paddingTop: 72, gap: 0 }}>
        <div className="section-head" style={{ maxWidth: 820, marginBottom: 0 }}>
          <span className="eyebrow">About us</span>
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>
            We're building the missing link between <em>surplus</em> and <em>need</em>.
          </h1>
          <p className="lead">
            FoodBridge is a food-rescue platform that connects businesses with surplus food to NGOs and shelters that
            can serve it, fast and without double bookings.
          </p>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 40 }}>
        <div className="grid cols-2" style={{ gap: 48, alignItems: 'center' }}>
          <blockquote className="quote">
            The gap isn't supply. It's coordination. Food goes to waste because nobody knows it's there in time.
          </blockquote>
          <div className="stack-lg text-2">
            <p>
              Every evening, kitchens across the city are left with trays of food that's perfectly good to eat. A few
              kilometres away, a shelter is figuring out how to stretch dinner. Both sides want the same thing, but the
              tools in between are phone calls, WhatsApp forwards and luck.
            </p>
            <p>
              FoodBridge gives everyone a single live view: what's available, how long it lasts, and who's picking it
              up. One listing, one claim, one pickup, with the impact counted every time.
            </p>
          </div>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="eyebrow">What we value</span>
          <h2 className="display h2">Principles we build by</h2>
        </div>
        <div className="grid cols-4">
          {[
            [Leaf, 'Waste less', 'Every feature is judged by one question: does it get more food eaten?'],
            [Eye, 'Radical clarity', 'Everyone sees the same truth: status, time left, who\'s coming.'],
            [ShieldCheck, 'Privacy first', 'Addresses are only shared with the NGO actually doing the pickup.'],
            [HeartHandshake, 'Dignity', 'Simple tools that respect the time of volunteers and staff.'],
          ].map(([Icon, t, d], i) => (
            <div key={t} className="card">
              <div className={`feature-icon ${['', 'blue', '', 'amber'][i]}`}><Icon /></div>
              <h3 className="h3" style={{ marginBottom: 8 }}>{t}</h3>
              <p className="text-2 small">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="eyebrow">The team</span>
          <h2 className="display h2">Five people, one problem.</h2>
          <p className="lead">FoodBridge was designed and built end-to-end on the MERN stack.</p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
          {TEAM.map(([name, role]) => (
            <div key={name} className="card team-card">
              <span className="avatar lg">{initials(name)}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{name}</div>
                <div className="muted small">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="eyebrow">Under the hood</span>
          <h2 className="display h2">The stack</h2>
        </div>
        <div className="grid cols-4">
          {[
            ['MongoDB', 'Users, listings and the claim lifecycle. Atomic updates make claims race-safe.'],
            ['Express', 'REST API with JWT auth, role-based access and strict validation.'],
            ['React', 'Multi-page app with React Router, live countdowns and optimistic UI.'],
            ['Node.js', 'Runs the API, with automated tests on an in-memory database.'],
          ].map(([t, d]) => (
            <div key={t} className="card">
              <div className="display" style={{ fontSize: '1.8rem', marginBottom: 8 }}>{t}</div>
              <p className="text-2 small">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="cta-band">
          <h2 className="display h2">Want to help us waste less?</h2>
          <Link to="/register" className="btn btn-light btn-lg">Join FoodBridge <ArrowRight /></Link>
        </div>
      </section>
    </>
  );
}
