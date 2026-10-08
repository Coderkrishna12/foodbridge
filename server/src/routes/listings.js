import crypto from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import Listing, { FOOD_TYPES } from '../models/Listing.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const MAX_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // listings can be open for at most 7 days
const POPULATE = [
  { path: 'donor', select: 'name organization city' },
  { path: 'claimedBy', select: 'name organization city' },
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whitelist + validate fields. `partial` = update (all fields optional).
function parseListing(body, partial = false) {
  const data = {};
  const has = (k) => body[k] !== undefined || !partial;

  if (has('title')) {
    const v = String(body.title ?? '').trim();
    if (v.length < 3 || v.length > 100) return { error: 'Title must be 3–100 characters' };
    data.title = v;
  }
  if (body.description !== undefined) {
    const v = String(body.description).trim();
    if (v.length > 500) return { error: 'Description must be at most 500 characters' };
    data.description = v;
  }
  if (has('foodType')) {
    if (!FOOD_TYPES.includes(body.foodType)) return { error: `Food type must be one of: ${FOOD_TYPES.join(', ')}` };
    data.foodType = body.foodType;
  }
  if (has('quantity')) {
    const v = Number(body.quantity);
    if (!Number.isInteger(v) || v < 1 || v > 5000) return { error: 'Quantity must be a whole number of servings (1–5000)' };
    data.quantity = v;
  }
  if (has('pickupAddress')) {
    const v = String(body.pickupAddress ?? '').trim();
    if (v.length < 5 || v.length > 200) return { error: 'Pickup address must be 5–200 characters' };
    data.pickupAddress = v;
  }
  if (has('city')) {
    const v = String(body.city ?? '').trim();
    if (v.length < 2 || v.length > 50) return { error: 'City is required' };
    data.city = v;
  }
  if (has('expiresAt')) {
    const d = new Date(body.expiresAt);
    if (Number.isNaN(d.getTime())) return { error: 'Expiry must be a valid date/time' };
    if (d <= new Date()) return { error: 'Expiry time must be in the future' };
    if (d - Date.now() > MAX_EXPIRY_MS) return { error: 'Expiry can be at most 7 days from now' };
    data.expiresAt = d;
  }
  if (partial && Object.keys(data).length === 0) return { error: 'Nothing to update' };
  return { data };
}

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });
  next();
}

const isOwner = (listing, user) => String(listing.donor._id ?? listing.donor) === String(user._id);
const isClaimer = (listing, user) =>
  listing.claimedBy && String(listing.claimedBy._id ?? listing.claimedBy) === String(user._id);

const MAX_CODE_ATTEMPTS = 5;
const newPickupCode = () => String(crypto.randomInt(0, 10000)).padStart(4, '0');
const SECRET_FIELDS = '+pickupCode +pickupAttempts';

// Every response goes through here:
// - exact pickup address only for the donor and the claiming NGO
// - pickup code only for the claiming NGO, and only while the claim is active
function forViewer(listing, user) {
  const json = listing.toJSON();
  if (!isOwner(listing, user) && !isClaimer(listing, user)) delete json.pickupAddress;
  if (!(isClaimer(listing, user) && listing.status === 'claimed')) delete json.pickupCode;
  delete json.pickupAttempts;
  return json;
}

// BROWSE: open, unexpired listings — most urgent first. Filters: ?city=&foodType=
router.get('/', async (req, res, next) => {
  try {
    const filter = { status: 'available', expiresAt: { $gt: new Date() } };
    if (req.query.city) filter.city = new RegExp(`^${escapeRegex(String(req.query.city).trim())}$`, 'i');
    if (req.query.foodType) {
      if (!FOOD_TYPES.includes(req.query.foodType)) return res.status(400).json({ message: 'Invalid food type' });
      filter.foodType = req.query.foodType;
    }
    const listings = await Listing.find(filter).sort({ expiresAt: 1 }).limit(100).populate(POPULATE);
    res.json(listings.map((l) => forViewer(l, req.user)));
  } catch (err) {
    next(err);
  }
});

// MINE: donors see what they posted, NGOs see what they claimed
router.get('/mine', async (req, res, next) => {
  try {
    const filter = req.user.role === 'donor' ? { donor: req.user._id } : { claimedBy: req.user._id };
    const listings = await Listing.find(filter).sort({ createdAt: -1 }).select(SECRET_FIELDS).populate(POPULATE);
    res.json(listings.map((l) => forViewer(l, req.user)));
  } catch (err) {
    next(err);
  }
});

// READ one
router.get('/:id', validId, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).select(SECRET_FIELDS).populate(POPULATE);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(forViewer(listing, req.user));
  } catch (err) {
    next(err);
  }
});

// CREATE (donors only)
router.post('/', requireRole('donor'), async (req, res, next) => {
  try {
    const { data, error } = parseListing({ city: req.user.city, ...req.body });
    if (error) return res.status(400).json({ message: error });
    const listing = await Listing.create({ ...data, donor: req.user._id });
    res.status(201).json(await listing.populate(POPULATE));
  } catch (err) {
    next(err);
  }
});

// UPDATE (owner only, and only while nobody has claimed it)
router.put('/:id', validId, requireRole('donor'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || !isOwner(listing, req.user)) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'available') {
      return res.status(409).json({ message: `Can't edit a listing that is already ${listing.status}` });
    }
    const { data, error } = parseListing(req.body, true);
    if (error) return res.status(400).json({ message: error });
    Object.assign(listing, data);
    await listing.save();
    res.json(forViewer(await listing.populate(POPULATE), req.user));
  } catch (err) {
    next(err);
  }
});

// DELETE (owner only, not while an NGO is on the way)
router.delete('/:id', validId, requireRole('donor'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || !isOwner(listing, req.user)) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status === 'claimed') {
      return res.status(409).json({ message: 'An NGO has claimed this listing. Ask them to release it first.' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted', id: listing._id });
  } catch (err) {
    next(err);
  }
});

// CLAIM (NGOs only). Atomic: only one NGO can win, even if two click at the same time.
router.post('/:id/claim', validId, requireRole('ngo'), async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'available', expiresAt: { $gt: new Date() } },
      { status: 'claimed', claimedBy: req.user._id, claimedAt: new Date(), pickupCode: newPickupCode(), pickupAttempts: 0 },
      { new: true }
    )
      .select(SECRET_FIELDS)
      .populate(POPULATE);
    if (listing) return res.json(forViewer(listing, req.user));

    const exists = await Listing.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: 'Listing not found' });
    res.status(409).json({ message: 'This food is no longer available (already claimed or expired)' });
  } catch (err) {
    next(err);
  }
});

// RELEASE a claim (the claiming NGO only) -> back to available
router.post('/:id/release', validId, requireRole('ngo'), async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'claimed', claimedBy: req.user._id },
      { status: 'available', claimedBy: null, claimedAt: null, $unset: { pickupCode: 1, pickupAttempts: 1 } },
      { new: true }
    ).populate(POPULATE);
    if (!listing) return res.status(404).json({ message: 'No active claim of yours on this listing' });
    res.json(forViewer(listing, req.user));
  } catch (err) {
    next(err);
  }
});

// COMPLETE: the donor hands over the food and enters the 4-digit code the NGO shows them.
// Wrong codes are counted; after MAX_CODE_ATTEMPTS the code is rotated so it can't be brute-forced.
router.post('/:id/complete', validId, requireRole('donor'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).select(SECRET_FIELDS);
    if (!listing || !isOwner(listing, req.user)) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'claimed') return res.status(409).json({ message: 'Only claimed listings can be completed' });

    const code = String(req.body.code ?? '').trim();
    if (!/^\d{4}$/.test(code)) return res.status(400).json({ message: 'Enter the 4-digit pickup code from the NGO' });

    if (code !== listing.pickupCode) {
      listing.pickupAttempts = (listing.pickupAttempts || 0) + 1;
      if (listing.pickupAttempts >= MAX_CODE_ATTEMPTS) {
        listing.pickupCode = newPickupCode();
        listing.pickupAttempts = 0;
        await listing.save();
        return res.status(429).json({ message: 'Too many wrong codes. A new code has been sent to the NGO, so ask them for it.' });
      }
      await listing.save();
      const left = MAX_CODE_ATTEMPTS - listing.pickupAttempts;
      return res.status(400).json({ message: `Wrong code. ${left} attempt${left === 1 ? '' : 's'} left.` });
    }

    listing.status = 'completed';
    listing.completedAt = new Date();
    listing.pickupCode = undefined;
    listing.pickupAttempts = undefined;
    await listing.save();
    res.json(forViewer(await listing.populate(POPULATE), req.user));
  } catch (err) {
    next(err);
  }
});

export default router;
