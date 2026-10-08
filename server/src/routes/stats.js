import { Router } from 'express';
import Listing from '../models/Listing.js';
import User from '../models/User.js';

const router = Router();

// Public impact numbers for the landing page
router.get('/', async (req, res, next) => {
  try {
    const [[saved], donors, ngos, active] = await Promise.all([
      Listing.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, meals: { $sum: '$quantity' }, pickups: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      Listing.countDocuments({ status: 'available', expiresAt: { $gt: new Date() } }),
    ]);
    res.json({ mealsSaved: saved?.meals || 0, pickups: saved?.pickups || 0, donors, ngos, activeListings: active });
  } catch (err) {
    next(err);
  }
});

export default router;
