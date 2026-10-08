// Seeds demo accounts + listings so the app isn't empty. Run: npm run seed
// Demo logins (password for both: demopass1):
//   donor@demo.test  - Spice Garden Restaurant (donor)
//   ngo@demo.test    - Annapurna Shelter (NGO)
import 'dotenv/config';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Listing from '../src/models/Listing.js';

const PASSWORD = 'demopass1';
const inHours = (h) => new Date(Date.now() + h * 3600e3);

await mongoose.connect(process.env.MONGO_URI);

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  return User.create({ ...data, password: PASSWORD });
}

const donor = await upsertUser({ name: 'Ravi Kumar', email: 'donor@demo.test', role: 'donor', organization: 'Spice Garden Restaurant', city: 'Pune' });
const donor2 = await upsertUser({ name: 'Meera Shah', email: 'cafe@demo.test', role: 'donor', organization: 'Green Leaf Caterers', city: 'Pune' });
const ngo = await upsertUser({ name: 'Asha Patil', email: 'ngo@demo.test', role: 'ngo', organization: 'Annapurna Shelter', city: 'Pune' });

await Listing.deleteMany({ donor: { $in: [donor._id, donor2._id] } });
const addr = '12 MG Road, Camp';
await Listing.insertMany([
  { title: 'Veg biryani & dal', foodType: 'veg', quantity: 40, pickupAddress: addr, city: 'Pune', expiresAt: inHours(1.5), donor: donor._id, description: 'Packed in foil trays. Ask for Ravi at the counter.', packaging: 'foil-trays', preparation: ['freshly-cooked', 'ready-to-eat', 'fssai-kitchen'], dietary: ['no-onion-garlic'] },
  { title: 'Chicken curry + rotis', foodType: 'non-veg', quantity: 25, pickupAddress: addr, city: 'Pune', expiresAt: inHours(5), donor: donor._id, packaging: 'containers', preparation: ['cooked-today', 'needs-reheating'], dietary: ['spicy', 'contains-dairy'] },
  { title: 'Wedding buffet surplus', foodType: 'mixed', quantity: 120, pickupAddress: 'Lawn 3, Koregaon Park', city: 'Pune', expiresAt: inHours(10), donor: donor2._id, description: 'Rice, dal, paneer, sweets.', packaging: 'bulk', preparation: ['cooked-today'], dietary: ['contains-dairy', 'contains-nuts'] },
  { title: 'Sandwich & fruit boxes', foodType: 'veg', quantity: 35, pickupAddress: 'Lawn 3, Koregaon Park', city: 'Pune', expiresAt: inHours(20), donor: donor2._id, packaging: 'individual', preparation: ['refrigerated', 'ready-to-eat'], dietary: ['eggless', 'contains-gluten'] },
  { title: 'Lunch thali packs', foodType: 'veg', quantity: 30, pickupAddress: addr, city: 'Pune', expiresAt: inHours(6), donor: donor._id, status: 'claimed', claimedBy: ngo._id, claimedAt: new Date(), pickupCode: String(crypto.randomInt(0, 10000)).padStart(4, '0') },
  { title: 'Breakfast idli & sambar', foodType: 'veg', quantity: 60, pickupAddress: addr, city: 'Pune', expiresAt: inHours(3), donor: donor._id, status: 'completed', claimedBy: ngo._id, claimedAt: inHours(-2), completedAt: inHours(-1) },
]);

console.log('Seeded demo data. Logins: donor@demo.test / ngo@demo.test (password in scripts/seed.js)');
await mongoose.disconnect();
