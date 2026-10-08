import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ChevronRight, ClipboardList, HandHeart, Lock, Plus, Search, Truck, Undo2 } from 'lucide-react';
import { StatusBadge } from '../components/ListingBits.jsx';

const FAQ = [
  ['Who can post food?', 'Any donor account: restaurants, hotels, hostels, college messes, caterers and event venues. NGOs can only claim.'],
  ['What happens if two NGOs claim at the same moment?', 'Exactly one wins. The claim is a single atomic database update, so the second request is told the food is no longer available.'],
  ['When is my address shared?', 'Only after an NGO claims your listing, and only with that NGO. Everyone else just sees the city.'],
  ['Can I edit a listing after posting?', 'Yes, as long as nobody has claimed it yet. Once claimed it\'s locked, so the NGO on the way sees exactly what they agreed to.'],
  ['What if plans change after claiming?', 'The NGO can release the claim and the listing instantly becomes available to others again.'],
  ['How does the 4-digit pickup code work?', 'When an NGO claims a listing, FoodBridge generates a random code that only that NGO can see. At pickup the donor enters it, so the food can only be handed to the NGO that actually claimed it. After 5 wrong attempts the code is replaced with a new one.'],
  ['What happens when food expires?', 'It disappears from the NGO feed and can\'t be claimed. The donor can extend it if the food is still good.'],
];

export default function HowItWorks() {
  return (
    <>
      <section className="container page" style={{ paddingTop: 72, gap: 0 }}>
        <div className="section-head" style={{ maxWidth: 760, marginBottom: 0 }}>
          <span className="eyebrow">How it works</span>
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.4rem)' }}>
            From leftover tray to <em>someone's plate</em>, in four steps.
          </h1>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 48 }}>
        <div className="grid cols-2" style={{ gap: 20 }}>
          <Track
            icon={Building2}
            tone="amber"
            title="If you're a donor"
            steps={[
              [Plus, 'Post your surplus', 'Title, veg / non-veg, servings, pickup address and best-before time. You see a live preview as you type.'],
              [ClipboardList, 'Track it live', 'Your dashboard shows each listing\'s status and countdown. Edit or extend any time before it\'s claimed.'],
              [Truck, 'Verify & hand over', 'When the NGO arrives, ask for their 4-digit pickup code and enter it. Correct code = handover confirmed, meals counted.'],
            ]}
          />
          <Track
            icon={HandHeart}
            tone=""
            title="If you're an NGO"
            steps={[
              [Search, 'Browse nearby', 'Open listings in your city, most urgent first. Filter by veg, non-veg or mixed.'],
              [Lock, 'Claim it', 'One click. It\'s now yours alone and the exact pickup address is revealed to you.'],
              [Undo2, 'Show your code', 'At pickup, show the donor your 4-digit code. Plans changed? Release the claim so another NGO can take it.'],
            ]}
          />
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="card card-lg">
          <div className="grid cols-2" style={{ gap: 32, alignItems: 'center' }}>
            <div className="stack" style={{ gap: 10 }}>
              <span className="eyebrow">Listing lifecycle</span>
              <h2 className="display h2">Every listing has one clear state.</h2>
              <p className="text-2">No ambiguity about whether food is still there or who is coming for it.</p>
            </div>
            <div className="stack-lg">
              <div className="lifecycle">
                <StatusBadge status="available" /><ChevronRight />
                <StatusBadge status="claimed" /><ChevronRight />
                <StatusBadge status="completed" />
              </div>
              <ul className="check-list">
                <li><ChevronRight /> Donors can edit or delete only while a listing is available.</li>
                <li><ChevronRight /> Claimed listings are locked until picked up or released.</li>
                <li><ChevronRight /> Past its best-before, a listing becomes <StatusBadge status="expired" /> and can't be claimed.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section container container-sm" style={{ paddingTop: 0 }}>
        <div className="section-head center">
          <span className="eyebrow">FAQ</span>
          <h2 className="display h2">Questions, answered</h2>
        </div>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q} <Plus /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 48 }}>
          <Link to="/register" className="btn btn-lg">Get started <ArrowRight /></Link>
        </div>
      </section>
    </>
  );
}

function Track({ icon: Icon, tone, title, steps }) {
  return (
    <div className="card card-lg stack-lg">
      <div className="row" style={{ gap: 14 }}>
        <div className={`feature-icon ${tone}`} style={{ margin: 0 }}><Icon /></div>
        <h2 className="h3" style={{ fontSize: '1.3rem' }}>{title}</h2>
      </div>
      <ol className="timeline">
        {steps.map(([StepIcon, t, d]) => (
          <li key={t} className="done">
            <span className="dot"><StepIcon /></span>
            <div>
              <div className="t">{t}</div>
              <div className="text-2 small" style={{ marginTop: 4 }}>{d}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
