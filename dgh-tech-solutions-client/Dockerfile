# ── Frontend Dockerfile (multi-stage) ────────────────────────────────────────

# ── Stage 1: Build Angular app ────────────────────────────────────────────────
# Builder stage is never shipped — vulnerabilities here don't affect the final image
FROM node:20-alpine3.21 AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./

# Install all dependencies (dev deps required for Angular build tools)
# npm install is used here because the lock file must be generated inside the
# container to match this exact Node/npm version. Once a lock file produced
# inside the container is committed, this can be switched to `npm ci`.
RUN npm install --no-audit --prefer-offline 2>/dev/null || npm install --no-audit

# Copy source and build for production
# Produces output at dist/dgh-tech-solutions-client/browser/
COPY . .
RUN npm run build:prod

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
# Pin to Alpine 3.21; apk upgrade patches all OS CVEs in the shipped image
FROM nginx:1.27-alpine3.21

# Upgrade all Alpine packages to latest patch versions (fixes OS-level CVEs)
RUN apk upgrade --no-cache

# Remove default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built Angular files from the builder stage
# Angular 18 application builder outputs to dist/{name}/browser/
COPY --from=builder /app/dist/dgh-tech-solutions-client/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
