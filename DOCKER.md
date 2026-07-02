# Docker Deployment — DGH Tech Solutions

## Architecture

```
Browser → nginx (port 80) ──┬── /api/* → backend:8000 (internal)
                            └── /*     → Angular SPA (index.html)
```

MongoDB is external (Atlas). No local MongoDB container is included.

---

## Prerequisites

- Docker Engine 24+
- Docker Compose v2 (`docker compose`, not `docker-compose`)
- A filled-in `dgh-tech-solutions-api/.env` (see Required Variables below)

---

## Required .env Variables

Create `dgh-tech-solutions-api/.env` with the following keys (no secret values shown):

```
PORT=8000
NODE_ENV=production

MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost
SERVER_URL=http://localhost

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

> The `.env` file is never copied into the image. It is injected at container start via `env_file` in docker-compose.yml.

---

## Build Images

```bash
# From the project root (where docker-compose.yml lives)
docker compose build
```

To force a clean rebuild (no layer cache):

```bash
docker compose build --no-cache
```

---

## Run

```bash
docker compose up -d
```

The app will be available at **http://localhost** (port 80).

---

## View Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend / nginx only
docker compose logs -f frontend
```

---

## Stop

```bash
docker compose down
```

---

## Restart a Single Container

```bash
docker compose restart backend
docker compose restart frontend
```

---

## Rebuild After Code Changes

```bash
# Rebuild and restart in one command
docker compose up -d --build

# Or rebuild a specific service
docker compose up -d --build backend
docker compose up -d --build frontend
```

---

## Health Check

```bash
curl http://localhost/api/health
```

Expected response:
```json
{ "success": true, "db": "connected", ... }
```

---

## Local Development (non-Docker)

Local development is unchanged:

```bash
# Backend
cd dgh-tech-solutions-api
npm run dev        # nodemon server.js on :8000

# Frontend
cd dgh-tech-solutions-client
npm start          # ng serve on :4200
```

The `src/environments/environment.ts` still points to `http://localhost:8000/api`, so `ng serve` works as before.

---

## DigitalOcean Deployment Notes

1. **Push code** to your repository (GitHub/GitLab).
2. On your Droplet, install Docker and Docker Compose.
3. Clone the repo and fill in `.env`.
4. Run `docker compose up -d --build`.
5. To serve on HTTPS, put **nginx** or **Caddy** in front on the host (or use a DigitalOcean Load Balancer), terminating TLS and forwarding to port 80 of the frontend container.
6. Point your DNS `A` record to the Droplet IP.
7. For the Stripe webhook endpoint, update your Stripe dashboard to `https://yourdomain.com/api/payments/webhook`.

### Resource recommendation (minimum)

| Resource | Recommended |
|---|---|
| Droplet | 2 GB RAM / 1 vCPU |
| MongoDB | Atlas M0 (free) or M10+ |
| S3 | AWS S3 or DigitalOcean Spaces |
