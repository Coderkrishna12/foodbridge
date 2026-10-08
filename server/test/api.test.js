// API checks against an in-memory MongoDB. Run: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test'; // disables rate limiting
const { default: app } = await import('../src/app.js');
const { default: Listing } = await import('../src/models/Listing.js');

let mongo, server, base;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body && JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

const inHours = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const user = (over) => ({ name: 'Test', password: 'secret1', city: 'Pune', organization: 'Org', ...over });
const food = (over) => ({
  title: 'Veg biryani',
  foodType: 'veg',
  quantity: 40,
  pickupAddress: '12 MG Road, Pune',
  expiresAt: inHours(4),
  ...over,
});

let donor, donor2, ngo, ngo2, listingId;

test('health + public stats', async () => {
  assert.equal((await req('GET', '/health')).status, 200);
  const s = await req('GET', '/stats');
  assert.equal(s.status, 200);
  assert.equal(s.data.mealsSaved, 0);
});

test('register validation', async () => {
  const bad = [
    user({ email: 'a@x.com', role: 'admin' }),
    user({ email: 'a@x.com', role: 'donor', name: 'A' }),
    user({ email: 'nope', role: 'donor' }),
    user({ email: 'a@x.com', role: 'donor', password: '123' }),
    user({ email: 'a@x.com', role: 'donor', city: '' }),
    user({ email: 'a@x.com', role: 'ngo', organization: '' }),
  ];
  for (const b of bad) assert.equal((await req('POST', '/auth/register', b)).status, 400, JSON.stringify(b));
});

test('register donors + NGOs, duplicate email rejected, no password leak', async () => {
  const r = await req('POST', '/auth/register', user({ email: 'Hotel@X.com', role: 'donor' }));
  assert.equal(r.status, 201);
  assert.equal(r.data.user.email, 'hotel@x.com');
  assert.equal(r.data.user.password, undefined);
  donor = r.data.token;

  assert.equal((await req('POST', '/auth/register', user({ email: 'hotel@x.com', role: 'ngo' }))).status, 409);

  donor2 = (await req('POST', '/auth/register', user({ email: 'cafe@x.com', role: 'donor' }))).data.token;
  ngo = (await req('POST', '/auth/register', user({ email: 'ngo@x.com', role: 'ngo' }))).data.token;
  ngo2 = (await req('POST', '/auth/register', user({ email: 'ngo2@x.com', role: 'ngo' }))).data.token;
});

test('login', async () => {
  assert.equal((await req('POST', '/auth/login', { email: 'hotel@x.com', password: 'wrong!' })).status, 401);
  assert.equal((await req('POST', '/auth/login', {})).status, 400);
  const r = await req('POST', '/auth/login', { email: 'hotel@x.com', password: 'secret1' });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.role, 'donor');
});

test('protected routes need a valid token', async () => {
  assert.equal((await req('GET', '/listings')).status, 401);
  assert.equal((await req('GET', '/listings', null, 'garbage')).status, 401);
});

test('CREATE listing: validation + role check', async () => {
  const bad = [
    food({ title: 'ab' }),
    food({ foodType: 'pizza' }),
    food({ quantity: 0 }),
    food({ quantity: 2.5 }),
    food({ pickupAddress: 'x' }),
    food({ expiresAt: inHours(-1) }),
    food({ expiresAt: inHours(24 * 8) }),
    food({ expiresAt: 'tomorrow-ish' }),
  ];
  for (const b of bad) assert.equal((await req('POST', '/listings', b, donor)).status, 400, JSON.stringify(b));

  assert.equal((await req('POST', '/listings', food(), ngo)).status, 403); // NGOs can't post

  const r = await req('POST', '/listings', food({ status: 'completed', donor: 'hacker' }), donor);
  assert.equal(r.status, 201);
  assert.equal(r.data.status, 'available'); // status can't be injected
  assert.equal(r.data.city, 'Pune'); // defaults to donor's city
  assert.equal(r.data.donor.organization, 'Org');
  listingId = r.data._id;
});

test('READ: browse with filters, detail, mine', async () => {
  await req('POST', '/listings', food({ title: 'Chicken curry', foodType: 'non-veg', city: 'Mumbai' }), donor2);

  assert.equal((await req('GET', '/listings', null, ngo)).data.length, 2);
  assert.equal((await req('GET', '/listings?city=pune', null, ngo)).data.length, 1);
  assert.equal((await req('GET', '/listings?foodType=non-veg', null, ngo)).data.length, 1);
  assert.equal((await req('GET', '/listings?foodType=bad', null, ngo)).status, 400);

  const asNgo = (await req('GET', `/listings/${listingId}`, null, ngo)).data;
  assert.equal(asNgo.title, 'Veg biryani');
  assert.equal(asNgo.pickupAddress, undefined); // address hidden until claimed
  assert.equal((await req('GET', `/listings/${listingId}`, null, donor)).data.pickupAddress, '12 MG Road, Pune');
  assert.equal((await req('GET', '/listings/not-an-id', null, ngo)).status, 400);
  assert.equal((await req('GET', `/listings/${new mongoose.Types.ObjectId()}`, null, ngo)).status, 404);

  assert.equal((await req('GET', '/listings/mine', null, donor)).data.length, 1);
});

test('UPDATE listing: owner only, validated', async () => {
  const r = await req('PUT', `/listings/${listingId}`, { quantity: 50, title: 'Veg biryani + raita' }, donor);
  assert.equal(r.status, 200);
  assert.equal(r.data.quantity, 50);
  assert.equal(r.data.foodType, 'veg');

  assert.equal((await req('PUT', `/listings/${listingId}`, {}, donor)).status, 400);
  assert.equal((await req('PUT', `/listings/${listingId}`, { quantity: -5 }, donor)).status, 400);
  assert.equal((await req('PUT', `/listings/${listingId}`, { title: 'pwned' }, donor2)).status, 404);
  assert.equal((await req('PUT', `/listings/${listingId}`, { title: 'pwned' }, ngo)).status, 403);
});

test('CLAIM is race-safe: two NGOs at once, exactly one wins', async () => {
  const [a, b] = await Promise.all([
    req('POST', `/listings/${listingId}/claim`, null, ngo),
    req('POST', `/listings/${listingId}/claim`, null, ngo2),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);

  // Make sure `ngo` is the claimer for the remaining tests
  const winner = a.status === 200 ? ngo : ngo2;
  if (winner !== ngo) {
    await req('POST', `/listings/${listingId}/release`, null, ngo2);
    assert.equal((await req('POST', `/listings/${listingId}/claim`, null, ngo)).status, 200);
  }
  assert.equal((await req('POST', `/listings/${listingId}/claim`, null, donor)).status, 403);
  assert.equal((await req('GET', `/listings/${listingId}`, null, ngo)).data.pickupAddress, '12 MG Road, Pune');
  assert.equal((await req('GET', `/listings/${listingId}`, null, ngo2)).data.pickupAddress, undefined);
});

test('claimed listing is locked: no edit/delete, hidden from browse', async () => {
  assert.equal((await req('PUT', `/listings/${listingId}`, { quantity: 1 }, donor)).status, 409);
  assert.equal((await req('DELETE', `/listings/${listingId}`, null, donor)).status, 409);
  const browse = await req('GET', '/listings', null, ngo2);
  assert.ok(!browse.data.some((l) => l._id === listingId));
  assert.equal((await req('GET', '/listings/mine', null, ngo)).data.length, 1);
});

let pickupCode;

test('pickup code: only the claiming NGO can see it', async () => {
  const asNgo = (await req('GET', `/listings/${listingId}`, null, ngo)).data;
  assert.match(asNgo.pickupCode, /^\d{4}$/);
  pickupCode = asNgo.pickupCode;

  assert.equal((await req('GET', `/listings/${listingId}`, null, donor)).data.pickupCode, undefined);
  assert.equal((await req('GET', `/listings/${listingId}`, null, ngo2)).data.pickupCode, undefined);
  assert.equal((await req('GET', '/listings/mine', null, ngo)).data[0].pickupCode, pickupCode);
  assert.equal((await req('GET', '/listings/mine', null, donor)).data.find((l) => l._id === listingId).pickupCode, undefined);
  assert.ok(!JSON.stringify((await req('GET', `/listings/${listingId}`, null, ngo)).data).includes('pickupAttempts'));
});

test('release + complete permissions', async () => {
  const done = (body, token) => req('POST', `/listings/${listingId}/complete`, body, token);
  assert.equal((await req('POST', `/listings/${listingId}/release`, null, ngo2)).status, 404); // not their claim
  assert.equal((await done({ code: pickupCode }, ngo)).status, 403); // NGO can't self-complete
  assert.equal((await done({ code: pickupCode }, donor2)).status, 404); // not their listing

  assert.equal((await done({}, donor)).status, 400); // code required
  assert.equal((await done({ code: '12a4' }, donor)).status, 400); // must be 4 digits
  const wrong = pickupCode === '0000' ? '0001' : '0000';
  const w = await done({ code: wrong }, donor);
  assert.equal(w.status, 400);
  assert.match(w.data.message, /4 attempts left/);

  const r = await done({ code: pickupCode }, donor);
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'completed');
  assert.equal(r.data.pickupCode, undefined);
  assert.equal((await req('GET', `/listings/${listingId}`, null, ngo)).data.pickupCode, undefined); // gone after pickup
  assert.equal((await done({ code: pickupCode }, donor)).status, 409);

  const s = await req('GET', '/stats');
  assert.equal(s.data.mealsSaved, 50);
  assert.equal(s.data.donors, 2);
  assert.equal(s.data.ngos, 2);
});

test('pickup code: rotated after 5 wrong attempts, cleared on release', async () => {
  const l = (await req('POST', '/listings', food({ title: 'Code rotation test' }), donor)).data;
  await req('POST', `/listings/${l._id}/claim`, null, ngo);
  const code1 = (await req('GET', `/listings/${l._id}`, null, ngo)).data.pickupCode;
  const wrong = code1 === '0000' ? '0001' : '0000';

  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await req('POST', `/listings/${l._id}/complete`, { code: wrong }, donor)).status);
  assert.deepEqual(statuses, [400, 400, 400, 400, 429]);

  const code2 = (await req('GET', `/listings/${l._id}`, null, ngo)).data.pickupCode;
  assert.match(code2, /^\d{4}$/);
  if (code1 !== code2) {
    assert.equal((await req('POST', `/listings/${l._id}/complete`, { code: code1 }, donor)).status, 400); // old code dead
  }

  await req('POST', `/listings/${l._id}/release`, null, ngo);
  const raw = await Listing.findById(l._id).select('+pickupCode');
  assert.equal(raw.pickupCode, undefined); // cleared on release
  await req('DELETE', `/listings/${l._id}`, null, donor);
});

test('expired listings cannot be claimed and are hidden', async () => {
  const r = await req('POST', '/listings', food({ title: 'Old samosas' }), donor);
  await Listing.updateOne({ _id: r.data._id }, { expiresAt: new Date(Date.now() - 1000) });

  assert.equal((await req('POST', `/listings/${r.data._id}/claim`, null, ngo)).status, 409);
  assert.ok(!(await req('GET', '/listings', null, ngo)).data.some((l) => l._id === r.data._id));
  assert.equal((await req('GET', `/listings/${r.data._id}`, null, donor)).data.isExpired, true);
});

test('DELETE listing: owner only', async () => {
  const r = await req('POST', '/listings', food({ title: 'Extra rotis' }), donor);
  assert.equal((await req('DELETE', `/listings/${r.data._id}`, null, donor2)).status, 404);
  assert.equal((await req('DELETE', `/listings/${r.data._id}`, null, donor)).status, 200);
  assert.equal((await req('GET', `/listings/${r.data._id}`, null, donor)).status, 404);
});

test('unknown route returns 404 JSON', async () => {
  assert.equal((await req('GET', '/nope')).status, 404);
});
