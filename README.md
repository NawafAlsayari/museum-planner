# 🏛️ My Museum & Planner

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-deploy-2496ed?logo=docker&logoColor=white">
</p>

A personal website that combines a **public "museum"** (a curated gallery of your photos, projects, and achievements) with a **private dashboard** to manage it, plus a **task planner** with daily, weekly, and monthly views.

## Features

- **Public museum** — visitors can browse your showcase at `/museum/:username`, filter by type (Photos / Projects / Achievements), and open individual exhibit pages.
- **Private dashboard** — log in to add, edit, delete exhibits and upload images.
- **Task planner** — check-off lists with **daily**, **weekly**, and **monthly calendar** views.
- **Settings** — toggle museum public/private visibility and update your display name.
- **Password reset** — a "Forgot password" flow that emails a one-time reset link (works when SMTP is configured).
- **Future-ready** — the data model supports letting other users register and create their own museum.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database / ORM | PostgreSQL (host on Neon) + Prisma |
| Auth | JWT + bcrypt |
| Email | Nodemailer (SMTP) for password-reset emails |
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
npm run prisma:seed      # seeds admin user + sample data
npm run dev              # starts API on http://localhost:4000
```

Seed credentials: **admin@example.com** / **admin123** (override with `SEED_EMAIL`, `SEED_USERNAME`, `SEED_PASSWORD`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # starts app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend at `http://localhost:4000`.

> Set `VITE_API_BASE=http://localhost:4000` (or your deployed API URL) when the frontend and API are not on the same origin.

## Password reset

The app ships a "forgot password" flow:

- `POST /api/auth/forgot-password` (email) generates a one-time token and emails a reset link.
- `GET /reset-password?token=...` is a public page where the user picks a new password.
- `POST /api/auth/reset-password` (token + new password) sets the password.

To enable it, configure SMTP (Nodemailer). Any SMTP provider works — for Gmail use an **app password**, or use Mailgun / SendGrid / Postmark SMTP credentials. Set these in your `.env` (or the Render dashboard):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-password
MAIL_FROM="You <you@example.com>"      # optional, defaults to SMTP_USER
APP_URL=http://localhost:5173          # optional, defaults to RENDER_EXTERNAL_URL
```

> If SMTP is not configured, `/api/auth/forgot-password` returns `503`. Reset links expire after 1 hour and can only be used once.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET|PUT /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
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

"

# Password reset email (SMTP). Leave unset to disable the feature.
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER="you@example.com"
SMTP_PASS="your-smtp-password"
MAIL_FROM="You <you@example.com>"
APP_URL="http://localhost:5173"
```

## Deploying

The app ships as a **single Docker container** that hosts both the Express API and
the built React app (Express serves `frontend/dist` and falls back to `index.html`
for client-side routes). Data (DB rows **and** image bytes) lives in Postgres, so
no persistent disk is required. The container runs `prisma migrate deploy`, then
the (idempotent) seed (which creates the admin account; defaults to
`admin@example.com` / `admin123` unless `SEED_*` are set), then the API.

### Required environment variables

| Variable | Example | Purpose |
|---|---|---|
| `JWT_SECRET` | a long random string | Signs/verifies auth tokens (required) |
| `DATABASE_URL` | `postgresql://user:password@ep-xxx-pooler.aws.neon.tech/db?sslmode=require` | Runtime Postgres (pooled) connection (required) |
| `DIRECT_URL` | `postgresql://user:password@ep-xxx.aws.neon.tech/db?sslmode=require` | Migration Postgres (direct) connection (required) |
| `PORT` | `4000` | Listen port (set automatically by the provider) |

### Optional environment variables (admin seed & password reset)

| Variable | Example | Purpose |
|---|---|---|
| `SEED_EMAIL` | `admin@example.com` | Admin login email (default `admin@example.com`) |
| `SEED_USERNAME` | `admin` | Public museum username (default `admin`) |
| `SEED_PASSWORD` | a strong password | Admin password; if unset the seed uses `admin123` |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server for reset emails |
| `SMTP_PORT` | `587` | SMTP port (default 587) |
| `SMTP_SECURE` | `false` | `true` to use TLS on connect (e.g. port 465) |
| `SMTP_USER` | `you@gmail.com` | SMTP login |
| `SMTP_PASS` | an app password | SMTP password |
| `MAIL_FROM` | `You <you@gmail.com>` | From address (defaults to SMTP_USER) |
| `APP_URL` | `https://your-app.onrender.com` | Base URL for reset links (defaults to `RENDER_EXTERNAL_URL`) |

> Neon's "connect" page may append `&channel_binding=require` to both strings;
> that parameter is harmless and supported by Prisma — leave it in place.

### Render (default)

The included `render.yaml` blueprint defines a Docker web service on the **free**
tier (no disk needed):

1. Create a Postgres database on [Neon](https://neon.tech) and copy its **pooled**
   and **direct** connection strings.
2. Push this repo to GitHub/GitLab.
3. In Render: **New → Blueprint**, point it at the repo.
4. After the service is created, add `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`
   and (optional) `SMTP_*`, `SEED_*`, `MAIL_FROM`, `APP_URL` environment variables
   in the Render dashboard with your values. Set `SEED_PASSWORD` and `JWT_SECRET`
   to strong values.
5. Open the service URL, log in with the admin credentials.

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
- [x] Password reset via email (SMTP)
- [ ] Let visitors register and create their own museum
- [ ] Task recurrence / reminders
