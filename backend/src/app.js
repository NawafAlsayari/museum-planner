import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import exhibitRoutes from './routes/exhibits.js';
import museumRoutes from './routes/museum.js';
import taskRoutes from './routes/tasks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Uploaded images live on a configurable directory so the path can be a
// persistent volume in production.
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

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
