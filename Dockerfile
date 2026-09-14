# ---- Stage 1: build the React frontend ----
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: install backend deps + generate Prisma client ----
FROM node:20-slim AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate

# ---- Stage 3: runtime ----
FROM node:20-slim
# Prisma requires OpenSSL at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend /app/backend ./backend
COPY --from=frontend /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_URL=file:/data/museum.db \
    UPLOADS_DIR=/data/uploads

# Serve data (SQLite DB + uploaded images) from a persistent volume at /data.
WORKDIR /app/backend
EXPOSE 4000

CMD ["sh", "-c", "mkdir -p /data/uploads && npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
