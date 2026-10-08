import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User, { ROLES } from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { normalizePhone } from '../utils/phone.js';

const router = Router();
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  organization: u.organization,
  city: u.city,
  phone: u.phone || '',
});

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = req.body.role;
    const organization = String(req.body.organization || '').trim();
    const city = String(req.body.city || '').trim();

    if (name.length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Role must be donor or ngo' });
    if (organization.length < 2) return res.status(400).json({ message: 'Organization name is required' });
    if (city.length < 2) return res.status(400).json({ message: 'City is required' });
    const { phone, error } = normalizePhone(req.body.phone); // optional at sign-up
    if (error) return res.status(400).json({ message: error });

    if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, organization, city, phone });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Update own profile (email, role and password are not editable here)
router.patch('/me', protect, async (req, res, next) => {
  try {
    const u = req.user;
    if (req.body.name !== undefined) {
      const v = String(req.body.name).trim();
      if (v.length < 2 || v.length > 50) return res.status(400).json({ message: 'Name must be 2–50 characters' });
      u.name = v;
    }
    if (req.body.organization !== undefined) {
      const v = String(req.body.organization).trim();
      if (v.length < 2 || v.length > 100) return res.status(400).json({ message: 'Organization name is required' });
      u.organization = v;
    }
    if (req.body.city !== undefined) {
      const v = String(req.body.city).trim();
      if (v.length < 2 || v.length > 50) return res.status(400).json({ message: 'City is required' });
      u.city = v;
    }
    if (req.body.phone !== undefined) {
      const { phone, error } = normalizePhone(req.body.phone);
      if (error) return res.status(400).json({ message: error });
      u.phone = phone;
    }
    await u.save();
    res.json({ user: publicUser(u) });
  } catch (err) {
    next(err);
  }
});

export default router;
