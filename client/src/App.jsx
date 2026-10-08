import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Browse from './pages/Browse.jsx';
import ListingForm from './pages/ListingForm.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

const TITLES = {
  '/': 'Surplus food, rescued',
  '/about': 'About',
  '/how-it-works': 'How it works',
  '/contact': 'Contact',
  '/login': 'Log in',
  '/register': 'Create account',
  '/dashboard': 'Dashboard',
  '/browse': 'Find food',
  '/listings/new': 'Post surplus food',
  '/profile': 'Profile',
};

export default function App() {
  const { pathname } = useLocation();
  const isAuth = pathname === '/login' || pathname === '/register';

  // Scroll to top + page title on every navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    if (TITLES[pathname]) document.title = `${TITLES[pathname]} · FoodBridge`; // detail pages set their own
  }, [pathname]);

  return (
    <div className="app">
      <Navbar />
      <main key={pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ngo']} />}>
            <Route path="/browse" element={<Browse />} />
          </Route>

          <Route element={<ProtectedRoute roles={['donor']} />}>
            <Route path="/listings/new" element={<ListingForm />} />
            <Route path="/listings/:id/edit" element={<ListingForm />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuth && <Footer />}
    </div>
  );
}
