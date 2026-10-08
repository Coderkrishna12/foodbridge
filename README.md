# FoodBridge: Surplus Food Rescue Platform (MERN)

## Problem statement
Restaurants, hostels, caterers and event venues throw away large amounts of edible food every day, while
NGOs and shelters nearby struggle to feed people. Today the two sides coordinate through phone calls and
WhatsApp groups. That's too slow for food that expires in hours, there's no tracking, and often two NGOs show up
for the same food (or nobody does).

**FoodBridge** is a web platform where:
- **Donors** post surplus food with servings, food type, pickup address and a best-before time.
- **NGOs** browse open listings in their city, sorted by urgency, and **claim** one. Claiming is atomic, so only one
  NGO can ever get a listing, even if two click at the same instant.
- On claim, a random **4-digit pickup code** is shown only to that NGO. At handover the donor enters it, so food can only be released to the NGO that claimed it (5 wrong tries rotate the code).
- **Food photos** (up to 4 per listing): compressed in the browser, EXIF/GPS stripped, stored in MongoDB.
- **Packaging, preparation & dietary badges** (e.g. Individually packed, Freshly cooked, Jain, Contains nuts).
- **Chat on WhatsApp**: once a listing is claimed, the donor and the NGO get a one-tap WhatsApp chat (and call) with each other. Numbers are never shown to anyone else.
- The listing moves through **Available → Claimed → Picked up**. Expired food is automatically hidden and can't be claimed.
- Live **impact stats** (meals rescued, active listings, donors, NGOs) are shown on the landing page.

## Features
- **Full CRUD** on food listings: Create, Read (browse + detail + "mine"), **Update** (edit / extend expiry), Delete
- **Auth**: register/login/logout with roles (donor / NGO), bcrypt passwords, JWT, protected and role-restricted routes on both client and server
- **Multi-page** (React Router): Home (landing), How it works, About, Contact, Login, Register, Dashboard (role-specific),
  Find food (NGO), Post/Edit listing (donor), Listing detail, Profile, 404
- **Business rules / checks**
  - Server + client validation on every form (servings 1–5000, expiry in the future and ≤ 7 days, etc.)
  - Only donors can post; only NGOs can claim; only the owner can edit/delete
  - Listings can't be edited or deleted once claimed
  - Race-safe claim (single atomic MongoDB update)
  - Exact pickup address is only revealed to the donor and the NGO that claimed it
  - Only the donor or the claiming NGO can mark pickup complete; the NGO can release a claim
  - Field whitelisting (can't inject `status`, `donor`, etc.), invalid ids → 400, not found → 404, conflicts → 409, wrong role → 403

## UI / design
- Custom design system in `client/src/index.css`: color tokens, type scale (Instrument Serif + Inter), spacing, components
- **Light & dark mode** (follows system, toggle in navbar, no flash on load)
- Fully responsive with a mobile menu
- Live countdown bars on every listing (green → amber → red as expiry nears)
- **Live preview** of the listing card while a donor fills in the post form
- Toasts, custom confirm dialogs, skeleton loaders, empty states, page transitions
- Status timeline on listing detail, animated impact counters on the landing page
- Icons by [lucide-react](https://lucide.dev)
- Edit your team's names in `client/src/pages/About.jsx` (`TEAM` array)

## Security
- `.env` is git-ignored; only `server/.env.example` (placeholders) is committed
- Server refuses to start with a missing/weak `JWT_SECRET` (< 32 chars or the placeholder)
- Passwords hashed with bcrypt, never returned by the API; JWT auth with role checks on every protected route
- `helmet` security headers with a strict Content Security Policy (no inline scripts)
- Rate limiting: 20 logins / 10 sign-ups per 15 min per IP, 500 API requests overall
- 4-digit pickup code: generated with `crypto.randomInt`, never sent to anyone but the claiming NGO, rotated after 5 wrong attempts, cleared on release/pickup
- Photos: donors only, 3 MB cap, real file type checked by magic bytes (JPEG/PNG/WebP), held in memory (never written to disk), 40 uploads / 15 min, only the uploader can attach a photo, removed photos are deleted
- WhatsApp numbers: normalized and validated server-side, only sent to the other party of a claimed/completed pickup
- Request body limited to 10kb, field whitelisting, validation on every input
- Demo accounts from `npm run seed` are for local testing only; don't seed a production database

## Structure
```
server/   Express API
  src/models      User (role, organization, city), Listing (status lifecycle)
  src/routes      auth, listings (CRUD + claim/release/complete), stats
  src/middleware  JWT protect, requireRole, error handler
  test/           API tests (in-memory MongoDB)
client/   React (Vite)
  src/pages       Home, HowItWorks, About, Contact, Login, Register, Dashboard, Browse, ListingForm, ListingDetail, Profile, NotFound
  src/components  Navbar, Footer, ListingCard, ProtectedRoute (role-aware), GuestRoute
```

## Run locally
Prerequisites: Node 18+, and MongoDB running locally **or** a MongoDB Atlas connection string.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # set MONGO_URI and a long random JWT_SECRET
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```
The Vite dev server proxies `/api` to `http://localhost:5000`.

**Try it:** register one account as a *donor* and post food, then (in another browser or after logging out)
register as an *NGO*, open **Find food** and claim it.

## Deploy for free (Render + MongoDB Atlas)
The repo includes a [`render.yaml`](render.yaml) blueprint: one free web service builds the React app and serves it together with the API.

1. **Database:** create a free **M0** cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Add a database user, allow network access from `0.0.0.0/0` (Render's free plan has no fixed IP), and copy the connection string. Add the database name before the `?`:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/foodbridge?retryWrites=true&w=majority`
2. **App:** on [Render](https://render.com) choose **New → Blueprint**, connect this GitHub repo, and paste the Atlas string as `MONGO_URI` when asked. `JWT_SECRET` is generated automatically.
3. Every push to `main` redeploys. Free services sleep after 15 min without traffic; the first request after that takes about a minute.

Don't run `npm run seed` against the production database (the demo logins are public in this repo).

## Tests
```bash
cd server
npm test
```
20 checks: auth and validation, role permissions, full CRUD, the two-NGOs-claim-at-once race, claimed-listing locks,
release/complete permissions, expiry handling, address privacy, and impact stats.

## API
| Method | Endpoint | Who | Description |
|---|---|---|---|
| POST | /api/auth/register | public | `{name, email, password, role: donor\|ngo, organization, city}` |
| POST | /api/auth/login | public | `{email, password}` |
| PATCH | /api/auth/me | any user | Update name, organization, city, WhatsApp `phone` |
| POST | /api/images | donor | Upload one food photo (multipart field `image`), returns `{ id, url }` |
| GET | /api/images/:id | public | Serve a photo |
| GET | /api/auth/me | any user | Current user |
| GET | /api/stats | public | Meals rescued, pickups, donors, NGOs, open listings |
| GET | /api/listings?city=&foodType= | any user | Open, unexpired listings (most urgent first) |
| GET | /api/listings/mine | any user | Donor: my listings · NGO: my claims |
| GET | /api/listings/:id | any user | Listing detail |
| POST | /api/listings | donor | Create listing (incl. `images`, `packaging`, `preparation[]`, `dietary[]`) |
| PUT | /api/listings/:id | owner donor | Update (only while available) |
| DELETE | /api/listings/:id | owner donor | Delete (not while claimed) |
| POST | /api/listings/:id/claim | NGO | Claim (atomic) |
| POST | /api/listings/:id/release | claiming NGO | Release claim |
| POST | /api/listings/:id/complete | owner donor | Confirm handover with the NGO's 4-digit code `{ code }` |

Send the token as `Authorization: Bearer <token>`.
