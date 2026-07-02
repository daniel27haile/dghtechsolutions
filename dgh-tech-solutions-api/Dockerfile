# ── Backend Dockerfile ────────────────────────────────────────────────────────
# Pin to Alpine 3.21 for reproducible builds; apk upgrade patches all OS CVEs
FROM node:20-alpine3.21

# Upgrade all Alpine packages to latest patch versions (fixes OS-level CVEs)
# Install wget for the HEALTHCHECK — lighter than curl on Alpine
RUN apk upgrade --no-cache && \
    apk add --no-cache wget

WORKDIR /app

# Copy manifests first so Docker layer cache is reused when only source changes
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source (node_modules excluded via .dockerignore)
COPY . .

# Never bake .env into the image — secrets are injected at runtime via env_file
ENV NODE_ENV=production

# Drop root: the built-in 'node' user ships with every node:alpine image
USER node

EXPOSE 8000

# Health check using the existing /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1

CMD ["node", "server.js"]
