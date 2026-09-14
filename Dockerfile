# ---- Stage 1: build the React frontend ----
FROM node:20-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: install backend deps + generate Prisma client ----
FROM node:20-bookworm-slim AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate

# ---- Stage 3: runtime ----
FROM node:20-bookworm-slim
# Prisma requires OpenSSL at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend /app/backend ./backend
COPY --from=frontend /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production \
    PORT=4000

# Data (DB rows + image bytes) is stored in Postgres, provided via DATABASE_URL.
# The container runs migrations first (with retries to ride out Neon's
# cold-start advisory-lock timeouts), then the idempotent seed, then the API.
WORKDIR /app/backend
EXPOSE 4000

CMD ["sh", "-c", "if [ -z \"$DATABASE_URL\" ] || [ -z \"$DIRECT_URL\" ]; then echo 'FATAL: DATABASE_URL (runtime) and DIRECT_URL (migrations) must both be set in the Render dashboard env vars.'; exit 1; fi; attempts=0; until npx prisma migrate deploy; do attempts=$((attempts+1)); if [ \"$attempts\" -ge 5 ]; then echo 'FATAL: prisma migrate deploy failed after 5 attempts'; exit 1; fi; echo \"migrate deploy attempt $attempts failed; retrying in 3s...\"; sleep 3; done; node prisma/seed.js && node src/index.js"]
