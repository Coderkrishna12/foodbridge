import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import statsRoutes from './routes/stats.js';
import imageRoutes from './routes/images.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
const isTest = process.env.NODE_ENV === 'test';

// Number of reverse proxies in front of the app (Render / Cloudflare tunnel = 1) so req.ip is the
// real client IP for rate limiting. Override with TRUST_PROXY if your host adds more hops.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');

// Security headers + Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // React inline style attrs
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'], // blob: = local previews before upload
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

// Rate limits: strict on login/register (brute force), generous on the rest of the API
const limiter = (max, message) =>
  rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => isTest, message: { message } });
app.use('/api/auth/login', limiter(20, 'Too many login attempts. Try again in 15 minutes.'));
app.use('/api/auth/register', limiter(10, 'Too many accounts created. Try again later.'));
const uploadLimiter = limiter(40, 'Too many uploads. Try again later.');
app.use('/api/images', (req, res, next) => (req.method === 'POST' ? uploadLimiter(req, res, next) : next()));
app.use('/api', limiter(500, 'Too many requests. Please slow down.'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/images', imageRoutes);

// Production: serve the built React app (client/dist) from the same server,
// so frontend + API share one URL. Run `npm run build` in client/ first.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html'))); // SPA routes
}

app.use(notFound);
app.use(errorHandler);

export default app;
