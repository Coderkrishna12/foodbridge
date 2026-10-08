import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Sun, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import useTheme from '../hooks/useTheme.js';
import Logo from './ui/Logo.jsx';
import { initials } from '../utils/format.js';

const PUBLIC_LINKS = [
  ['/', 'Home'],
  ['/how-it-works', 'How it works'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on navigation / outside click
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const appLinks = user
    ? [
        ['/dashboard', 'Dashboard'],
        user.role === 'ngo' ? ['/browse', 'Find food'] : ['/listings/new', 'Post food'],
      ]
    : [];

  return (
    <header className={`nav ${scrolled || mobileOpen ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Logo />

        <nav className="nav-links" aria-label="Main">
          {(user ? appLinks : PUBLIC_LINKS).map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>

          {user ? (
            <>
              {user.role === 'donor' ? (
                <Link to="/listings/new" className="btn btn-sm hide-m"><Plus /> Post food</Link>
              ) : (
                <Link to="/browse" className="btn btn-sm hide-m"><Search /> Find food</Link>
              )}
              <div style={{ position: 'relative' }} ref={menuRef} className="hide-m">
                <button className="user-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="menu">
                  <span className="avatar">{initials(user.organization)}</span>
                  <ChevronDown />
                </button>
                {menuOpen && (
                  <div className="menu" role="menu">
                    <div className="menu-head">
                      <div style={{ fontWeight: 600 }}>{user.organization}</div>
                      <div className="muted small">{user.email}</div>
                    </div>
                    <Link to="/dashboard" role="menuitem"><LayoutDashboard /> Dashboard</Link>
                    <Link to="/profile" role="menuitem"><User /> Profile</Link>
                    <Link to="/about" role="menuitem"><span style={{ width: 16 }} /> About FoodBridge</Link>
                    <hr className="divider" style={{ margin: '6px 0' }} />
                    <button onClick={handleLogout} role="menuitem"><LogOut /> Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm hide-m">Log in</Link>
              <Link to="/register" className="btn btn-sm hide-m">Get started</Link>
            </>
          )}

          <button className="icon-btn nav-burger" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="mobile-menu" aria-label="Mobile">
          {[...appLinks, ...PUBLIC_LINKS].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/profile">Profile</NavLink>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <div className="row" style={{ marginTop: 8 }}>
              <Link to="/login" className="btn btn-secondary" style={{ flex: 1 }}>Log in</Link>
              <Link to="/register" className="btn" style={{ flex: 1 }}>Get started</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
