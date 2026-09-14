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
| Database / ORM | PostgreSQL (host on Neon) + Prisma |
| Auth | JWT + bcrypt |
| Uploads | multer (image bytes stored in Postgres as `BYTEA`) |
| Tests | Jest + supertest (backend), Vitest + Testing Library (frontend) |

## Project layout

```
backend/        Express API, Prisma schema, Postgres migrations
frontend/       React + Vite + Tailwind app
```

## Getting started

You need a Postgres database. The easiest path is a free [Neon](https://neon.tech) project; any Postgres works. Neon gives you two connection strings — a **pooled** one for runtime and a **direct** one for migrations. Set them as `DATABASE_URL` and `DIRECT_URL`.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then set DATABASE_URL + DIRECT_URL to your Neon strings
npm run prisma:migrate   # applies migrations to your Postgres DB
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

Uploaded images are stored in Postgres (`BYTEA`) and served from `GET /uploads/:id`, so no filesystem or persistent disk is needed.

## Tests

```bash
# Backend (uses supertest against the in-memory app; needs a migrated Postgres)
cd backend && node scripts/smoke.js

# Frontend (Vitest + Testing Library)
cd frontend && npm test
```

## Configuration

Backend uses a `.env` file:

```
# Runtime connection — Neon pooled string (host ends in -pooler)
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/db?sslmode=require"
# Migration connection — Neon direct string (same, minus -pooler)
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/db?sslmode=require"
JWT_SECRET="change-me-in-production"
PORT=4000
```

## Deploying

The app ships as a **single Docker container** that hosts both the Express API and
the built React app (Express serves `frontend/dist` and falls back to `index.html`
for client-side routes). Data (DB rows **and** image bytes) lives in Postgres, so
no persistent disk is required. The container runs `prisma migrate deploy`, then
the (idempotent) seed (which creates `admin@example.com` / `admin123`), then the API.

### Required environment variables

| Variable | Example | Purpose |
|---|---|---|
| `JWT_SECRET` | a long random string | Signs/verifies auth tokens (required) |
| `DATABASE_URL` | `postgresql://user:password@ep-xxx-pooler.aws.neon.tech/db?sslmode=require` | Runtime Postgres (pooled) connection (required) |
| `DIRECT_URL` | `postgresql://user:password@ep-xxx.aws.neon.tech/db?sslmode=require` | Migration Postgres (direct) connection (required) |
| `PORT` | `4000` | Listen port (set automatically by the provider) |

> Neon's "connect" page may append `&channel_binding=require` to both strings;
> that parameter is harmless and supported by Prisma — leave it in place.

### Render (default)

The included `render.yaml` blueprint defines a Docker web service on the **free**
tier (no disk needed):

1. Create a Postgres database on [Neon](https://neon.tech) and copy its **pooled**
   and **direct** connection strings.
2. Push this repo to GitHub/GitLab.
3. In Render: **New → Blueprint**, point it at the repo.
4. After the service is created, add `DATABASE_URL` and `DIRECT_URL` environment
   variables in the Render dashboard with your Neon strings, and generate a strong
   `JWT_SECRET`. (`render.yaml` auto-generates `JWT_SECRET` and lists the two DB
   vars as fields to fill in.)
5. Open the service URL, log in with `admin@example.com` / `admin123`.

> `DIRECT_URL` is **required** — `prisma migrate deploy` refuses to run without it,
> and Neon's direct connection can cold-start, so the container retries the
> migration a few times before giving up.

### Railway / Fly.io / Koyeb

These also deploy the `Dockerfile` directly. The main difference is where Postgres
lives — point `DATABASE_URL` (runtime) and `DIRECT_URL` (migrations) at a managed
Postgres (e.g. Neon) and set `JWT_SECRET`:

- **Railway** — deploy the repo, add a Postgres database and set `DATABASE_URL`/`DIRECT_URL`.
- **Fly.io** — `fly launch`, then provision a Postgres cluster and set `DATABASE_URL`/`DIRECT_URL`.
- **Koyeb** — deploy from the `Dockerfile`, set `DATABASE_URL`/`DIRECT_URL` to a managed Postgres.

### Local container test

```bash
docker compose up --build -d   # starts Postgres + app, serves on http://localhost:4000
```

## Roadmap

- [x] Museum showcase + private dashboard
- [x] Task planner (daily / weekly / monthly)
- [x] Image storage in Postgres (no local uploads / disk)
- [x] Hosted Postgres (Neon) + free-tier Render deployment
- [ ] Let visitors register and create their own museum
- [ ] Task recurrence / reminders
