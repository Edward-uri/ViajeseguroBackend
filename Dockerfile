# syntax=docker/dockerfile:1
# ---- Stage 1: build TypeScript ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# ---- Stage 2: solo deps de produccion ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- Stage 3: runtime liviano ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV UPLOADS_DIR=/app/uploads
RUN apk add --no-cache su-exec
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY db ./db
COPY scripts ./scripts
EXPOSE 3000
# Arranca como root SOLO para ajustar el dueño del volumen montado (Coolify lo monta como root)
# y luego baja privilegios a 'node' con su-exec. Migra + seed (idempotentes) y arranca.
# `exec` para que SIGTERM llegue a node (shutdown limpio). Si la DB no esta lista, Coolify reinicia.
CMD ["sh", "-c", "mkdir -p \"$UPLOADS_DIR\" && chown node:node \"$UPLOADS_DIR\" && node scripts/migrate.mjs && node scripts/migrate.mjs --seed && exec su-exec node node dist/index.js"]
