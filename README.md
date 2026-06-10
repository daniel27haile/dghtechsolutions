# DGH Tech Solutions

Full-stack corporate website for **DGH TECH SOLUTIONS**, founded by Daniel Getahun Haile.

**Live domain:** dghtechsolutions.com

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18 (standalone), TypeScript, SCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Security | bcryptjs, express-rate-limit, express-validator |

---

## Project Structure

```
dghtechsolutions/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, rate-limit, error handler
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── scripts/         # Database seed script
│   ├── .env             # Environment variables (do not commit)
│   ├── .env.example     # Template for env vars
│   ├── package.json
│   └── server.js        # Entry point
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   │   ├── guards/       # Auth guard
    │   │   │   ├── interceptors/ # JWT interceptor
    │   │   │   ├── models/       # TypeScript interfaces
    │   │   │   └── services/     # API services
    │   │   ├── layouts/
    │   │   │   ├── public-layout/
    │   │   │   └── admin-layout/
    │   │   ├── pages/
    │   │   │   ├── public/       # Home, Services, About, Contact, etc.
    │   │   │   └── admin/        # Dashboard, Projects, Services, Messages, Content, Settings
    │   │   └── shared/
    │   │       └── components/   # Navbar, Footer, Cards, Carousel, etc.
    │   ├── environments/
    │   └── styles.scss           # Global styles + CSS variables
    ├── angular.json
    └── package.json
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Angular CLI 18: `npm install -g @angular/cli@18`

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Copy and edit environment variables:
```bash
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
```

Seed the database (creates admin user + starter content):
```bash
npm run seed
```

Start the dev server:
```bash
npm run dev       # Nodemon (hot reload)
# or
npm start         # Production
```

Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
ng serve
```

Frontend runs on: `http://localhost:4200`

---

## Default Admin Credentials

After running the seed script:

| Field | Value |
|-------|-------|
| Username | `daniel` |
| Password | `Admin@2024!` |
| Admin URL | `http://localhost:4200/admin` |

**Change the password immediately after first login via Settings.**

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/projects` | Published projects |
| GET | `/api/projects/:id` | Project by ID or slug |
| GET | `/api/services` | Active services |
| GET | `/api/content` | All site content |
| GET | `/api/content/:key` | Content by key |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/analytics/track` | Track page visit |

### Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Current admin |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/projects/admin/all` | All projects (admin) |
| POST | `/api/projects/admin` | Create project |
| PUT | `/api/projects/admin/:id` | Update project |
| DELETE | `/api/projects/admin/:id` | Delete project |
| PATCH | `/api/projects/admin/:id/toggle-publish` | Publish/unpublish |
| GET | `/api/services/admin/all` | All services (admin) |
| POST | `/api/services/admin` | Create service |
| PUT | `/api/services/admin/:id` | Update service |
| DELETE | `/api/services/admin/:id` | Delete service |
| PUT | `/api/content/admin/:key` | Update site content |
| GET | `/api/contact/admin/messages` | Contact messages |
| PATCH | `/api/contact/admin/messages/:id/read` | Mark message read |
| DELETE | `/api/contact/admin/messages/:id` | Delete message |
| GET | `/api/analytics/admin/summary` | Analytics data |

---

## Site Content Keys

The `SiteContent` collection uses a key-value model. Keys:

| Key | Description |
|-----|-------------|
| `hero` | Hero section — headline, CTA buttons, badge |
| `about` | About section — bio, founder info, stats, values |
| `cta` | Call-to-action section |
| `settings` | Global — logo, email, phone, social links, footer |
| `contact_info` | Contact page info |

All editable from the admin panel at `/admin/content` and `/admin/settings`.

---

## Admin Panel Pages

| Route | Page |
|-------|------|
| `/admin/login` | Login |
| `/admin/dashboard` | Stats + analytics |
| `/admin/projects` | CRUD projects |
| `/admin/services` | CRUD services |
| `/admin/messages` | View contact messages |
| `/admin/content` | Edit hero, about, CTA, contact info |
| `/admin/settings` | Global settings + social links + password |

---

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT authentication with configurable expiry
- Rate limiting on login (10 req / 15 min) and contact form (5 / hour)
- Raw IP addresses are never stored — SHA-256 hashed identifiers only
- CORS restricted to frontend origin
- Input validation with express-validator
- Environment variables for all secrets
- Admin routes protected by auth guard on frontend + JWT middleware on backend

---

## Deployment

### Backend (Node.js)

**Render / Railway / DigitalOcean:**
1. Set environment variables in the platform dashboard
2. Set `NODE_ENV=production`
3. Set `MONGO_URI` to your MongoDB Atlas connection string
4. Set `FRONTEND_URL` to your production frontend URL
5. Build command: `npm install`
6. Start command: `npm start`

### Frontend (Angular)

**Vercel / Netlify / AWS S3:**
```bash
cd frontend
ng build --configuration production
```

Deploy the `dist/dgh-tech-frontend/browser/` folder.

For Vercel / Netlify — add a redirect rule so Angular routing works:
- All routes → `/index.html` (200 rewrite, not 301)

### MongoDB

Use [MongoDB Atlas](https://www.mongodb.com/atlas) for production. Free tier is sufficient to start.

---

## Color Palette

| Variable | Color | Usage |
|----------|-------|-------|
| `--primary` | `#0a2463` | Deep navy blue — buttons, headings |
| `--primary-light` | `#1e3a8a` | Hover states |
| `--secondary` | `#3e92cc` | Vibrant blue — links, accents |
| `--accent` | `#1b998b` | Teal green — features, success |
| `--accent-light` | `#2dd4bf` | Light teal — badges, highlights |
| `--dark` | `#0d1b2a` | Hero backgrounds, footer |

---

## Development Notes

- Angular 18 uses **standalone components** — no NgModules
- Routes are **lazy-loaded** for performance
- `@if` / `@for` control flow (Angular 17+ template syntax)
- All admin routes protected by `authGuard` (functional guard)
- JWT attached automatically by `jwtInterceptor` (functional interceptor)
- Analytics tracks only non-admin page views
- Visitor privacy: only `sha256(IP+UA).slice(0,24)` stored
