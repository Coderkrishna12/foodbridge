import { Link } from 'react-router-dom';
import Logo from './ui/Logo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="stack" style={{ gap: 16, maxWidth: 320 }}>
            <Logo />
            <p className="muted small">
              A live bridge between kitchens with surplus food and the people who can serve it, before it expires.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link to="/how-it-works">How it works</Link></li>
              <li><Link to="/register?role=donor">For donors</Link></li>
              <li><Link to="/register?role=ngo">For NGOs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Log in</Link></li>
              <li><Link to="/register">Create account</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FoodBridge. Built with MongoDB, Express, React & Node.</span>
          <span>Made to waste less.</span>
        </div>
      </div>
    </footer>
  );
}
