# 🏛️ My Museum & Planner

A personal website that combines a **public "museum"** (a curated gallery of your photos, projects, and achievements) with a **private dashboard** to manage it, plus a **task planner** with daily, weekly, and monthly views.

## Features

- **Public museum** — visitors can browse your showcase at `/museum/:username`, filter by type (Photos / Projects / Achievements), and open individual exhibit pages.
- **Private dashboard** — log in to add, edit, delete exhibits and upload images.
- **Task planner** — check-off lists with **daily**, **weekly**, and **monthly calendar** views.
- **Settings** — toggle museum public/private visibility and update your display name.
- **Future-ready** — the data model supports letting other users register and create their own museum.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database / ORM | SQLite + Prisma |
| Auth | JWT + bcrypt |
| Uploads | multer (local `/uploads`) |
| Tests | Jest + supertest (backend), Vitest + Testing Library (frontend) |

## Project layout

```
backend/        Express API, Prisma schema, SQLite DB, uploads
frontend/       React + Vite + Tailwind app
```

## Getting started

### 1. Backend

```bash
cd backend
npm install
npm run prisma:migrate   # creates the SQLite DB from prisma/schema.prisma
npm run prisma:seed      # seeds admin user + sample data (admin@example.com / admin123)
npm run dev              # starts API on http://localhost:4000
```

Seed credentials: **admin@example.com** / **admin123**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # starts app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend at `http://localhost:4000`.

> Set `VITE_API_BASE=http://localhost:4000` (or your deployed API URL) when the frontend and API are not on the same origin.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET|PUT /api/auth/me`
- `GET /api/museum/:username`, `GET /api/museum/exhibit/:id` — public
- `GET|POST /api/exhibits`, `GET|PUT|DELETE /api/exhibits/:id`, `POST /api/exhibits/:id/image` — private (JWT)
- `GET /api/tasks?view=daily|weekly|monthly&date=YYYY-MM-DD`, `POST /api/tasks`, `PATCH|PUT|DELETE /api/tasks/:id` — private (JWT)

## Tests

```bash
# Backend (uses supertest against the in-memory app)
cd backend && node scripts/smoke.js

# Frontend (Vitest + Testing Library)
cd frontend && npm test
```

## Configuration

Backend uses a `.env` file:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
PORT=4000
```

Production note: replace `JWT_SECRET` with a strong secret and switch SQLite to PostgreSQL (Prisma makes this a small schema/connection change) when hosting publicly.

## Deploying

The app ships as a **single Docker container** that hosts both the Express API and
the built React app (Express serves `frontend/dist` and falls back to `index.html`
for client-side routes). Two things must be persistent, so use a **volume/disk**:

- the SQLite database (set `DATABASE_URL`)
- uploaded images (set `UPLOADS_DIR`)

Everything lives under the single mount point `/data` (e.g. `/data/museum.db` and
`/data/uploads`). The container runs `prisma migrate deploy`, then the (idempotent)
seed (which creates `admin@example.com` / `admin123`), then the API.

### Required environment variables

| Variable | Example | Purpose |
|---|---|---|
| `JWT_SECRET` | a long random string | Signs/verifies auth tokens (required) |
| `DATABASE_URL` | `file:/data/museum.db` | SQLite file on the persistent volume |
| `UPLOADS_DIR` | `/data/uploads` | Where uploaded images are stored |
| `PORT` | `4000` | Listen port (set automatically by the provider) |

### Render (default)

The included `render.yaml` blueprint defines a Docker web service with a disk:

1. Push this repo to GitHub/GitLab.
2. In Render: **New → Blueprint**, point it at the repo.
3. It creates the service, mounts a 1 GB disk at `/data`, and generates a random
   `JWT_SECRET` automatically.
4. Open the service URL, log in with `admin@example.com` / `admin123`.

> A persistent disk requires a **paid** Render instance (the free tier has no disk),
> because SQLite + file uploads need durable storage.

### Railway / Fly.io / Koyeb

These also deploy the `Dockerfile` directly. The main difference is how you attach
persistent storage:

- **Railway** — deploy the repo, add a **Volume** mounted at `/data`, and set the env vars.
- **Fly.io** — `fly launch` from the repo, then `fly volumes create museum-data` and
  `fly deploy` with `[mounts] source = "museum-data" destination = "/data"`.
- **Koyeb** — deploy from the `Dockerfile`, attach a persistent volume at `/data`.

In every case the same env vars (`JWT_SECRET`, `DATABASE_URL=file:/data/museum.db`,
`UPLOADS_DIR=/data/uploads`) are set from dashboard/UI.

### Local container test

```bash
docker compose up --build -d   # serves on http://localhost:4000
```

## Roadmap

- [x] Museum showcase + private dashboard
- [x] Task planner (daily / weekly / monthly)
- [ ] Let visitors register and create their own museum
- [ ] Task recurrence / reminders
- [ ] Cloud image storage
