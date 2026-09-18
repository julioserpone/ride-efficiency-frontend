# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base — shared Node runtime for every stage
# ---------------------------------------------------------------------------
FROM node:24-alpine AS base
WORKDIR /app
ENV CI=true

# ---------------------------------------------------------------------------
# Dependencies — installed once and reused by every other stage
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Development — Vite dev server with HMR (used by docker compose)
# ---------------------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development

# Polling makes Vite's watcher reliable on bind mounts coming from macOS
# (Docker Desktop's file sharing does not always emit inotify events).
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=300

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
