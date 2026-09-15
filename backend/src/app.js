import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import prisma from './db.js';
import authRoutes from './routes/auth.js';
import exhibitRoutes from './routes/exhibits.js';
import museumRoutes from './routes/museum.js';
import taskRoutes from './routes/tasks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Fail fast if JWT_SECRET is missing in production, otherwise fall back to an
// obviously-insecure dev secret so local development still boots.
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  process.env.JWT_SECRET = 'insecure-dev-secret-do-not-use-in-production';
  console.warn('JWT_SECRET not set; using an insecure development secret.');
}

// Browser-facing security headers (small enough that we do not need the
// `helmet` package).
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-DNS-Prefetch-Control', 'off');
  next();
});

// CORS is only needed for cross-origin dev setups. On Render the built SPA and
// the API are served from the same origin, so no CORS headers are required.
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin requests / curl / tests
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json());

// Image bytes are served straight from the database; /uploads/:id resolves an
// exhibit id rather than a filesystem path, so no persistent volume is needed.
// Images are only served for exhibits that belong to a public museum.
app.get('/uploads/:id', async (req, res, next) => {
  try {
    const exhibit = await prisma.exhibit.findUnique({
      where: { id: req.params.id },
      select: { imageData: true, imageMime: true, user: { select: { isPublic: true } } },
    });
    if (!exhibit || !exhibit.imageData || !exhibit.user.isPublic) {
      return res.status(404).end();
    }
    res.set('Content-Type', exhibit.imageMime || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(Buffer.from(exhibit.imageData));
  } catch (err) {
    return next(err);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exhibits', exhibitRoutes);
app.use('/api/museum', museumRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// In production the built SPA is served from this container so a single
// deployment hosts both the API and the React app. In local dev the frontend
// is served by Vite, so this only activates when a build is present.
const clientDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
const clientIndex = path.join(clientDist, 'index.html');
if (fs.existsSync(clientIndex)) {
  app.use(express.static(clientDist));
  // SPA fallback: let React Router handle non-API/client routes.
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(clientIndex));
}

// 404 handler (unmatched API routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;
