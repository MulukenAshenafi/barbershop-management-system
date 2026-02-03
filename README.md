# BarberBook

A full-stack barbershop booking platform: find shops, book services, buy products, and manage appointments. Built for customers and shop owners, with Firebase auth, Cloudinary media, and Chapa payments.

---

## Project overview

**What it is:** BarberBook is a mobile-first (React Native/Expo) and web-capable app backed by a Django REST API. Customers browse barbershops, book services, add products to cart, pay via Chapa, and manage appointments. Owners manage shops, staff, services, products, bookings, and payments from an admin dashboard.

**Problem it solves:** Centralizes discovery, booking, payments, and management for barbershops in one place, with a single API and shared auth (Firebase) and media (Cloudinary).

**High-level architecture:** Client (Expo app) talks to the Django API over HTTPS. The API uses PostgreSQL as the system of record and Firebase for identity (email/password, phone OTP, Google/Apple). No secrets or credentials are hardcoded; everything is driven by environment variables.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| **Backend** | Django 4.2, Django REST Framework, Gunicorn |
| **Database**| PostgreSQL 15 (PostGIS), run in Docker with a named volume |
| **Auth**    | Firebase (identity); Firebase Admin SDK (token verification); PostgreSQL (user/role store) |
| **Media**   | Cloudinary (optional) |
| **Payments**| Chapa (optional) |
| **Deployment** | Docker, Docker Compose; Render (Docker services) |
| **Client**  | React Native (Expo) – separate repo or local; consumes this API |

---

## Architecture (textual)

```
┌─────────────────────┐
│  Client             │  (Mobile/Web – Expo)
│  (BarberBook app)   │
└──────────┬──────────┘
           │ HTTPS / REST
           ▼
┌─────────────────────┐
│  Backend API        │  (Django in Docker)
│  Gunicorn :8000     │
└──────────┬──────────┘
           │
           ├──────────────────┐
           ▼                  ▼
┌─────────────────────┐  ┌─────────────────────┐
│  PostgreSQL         │  │  Firebase Auth       │
│  (Docker + volume)  │  │  (token verify)     │
└─────────────────────┘  └─────────────────────┘
```

- **Client** → **Backend**: All configuration via env (e.g. `EXPO_PUBLIC_API_URL`). No secrets in repo.
- **Backend** → **PostgreSQL**: Uses Docker service name `db` and env vars `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.
- **Backend** → **Firebase**: Token verification and user sync via `FIREBASE_PROJECT_ID` and `FIREBASE_CREDENTIALS`.

---

## Local development

### Prerequisites

- Docker and Docker Compose
- (Optional) Python 3.10+, Node 18+ if running backend or client without Docker

### Run with Docker Compose

1. **Clone and enter the repo**
   ```bash
   git clone <repo-url>
   cd BSBS_UPDATED
   ```

2. **Environment**
   - Copy the root `.env.example` to `.env` in the same directory (project root).
   - Set at least: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.  
   - For production-like local run: `DEBUG=False`, `ALLOWED_HOSTS=localhost,127.0.0.1`.

3. **Start services**
   ```bash
   docker compose up --build
   ```
   - **API:** http://localhost:8000  
   - **Admin:** http://localhost:8000/admin/  
   - **Swagger:** http://localhost:8000/api/docs/

4. **Create a superuser (first time)**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

5. **Run the client (optional, from another terminal)**
   ```bash
   cd client
   cp .env.example .env   # set EXPO_PUBLIC_API_URL to http://<your-ip>:8000/api for device
   npm install
   npm start
   ```

---

## Deployment (Render)

The project is designed to be deployed on **Render** using **Docker** (and optionally Docker Compose).

- **Backend:** Deploy as a **Web Service** with Docker. Use the same `Dockerfile` and build context as in this repo (e.g. build from `./backend`).
- **PostgreSQL:** For this portfolio/demo, **PostgreSQL is run inside Docker** (as in `docker-compose.yml`), not as Render’s managed Postgres. On Render you can either:
  - Use a **Blueprint** with Docker Compose so both the backend and the Postgres container run, or  
  - Run a single Dockerfile that is not used with Compose (e.g. only the backend), and attach a **Render-managed Postgres** instance and set `DB_*` to point to it.

**Free-tier limitations (transparent):**  
- Render free tier may spin down services after inactivity; cold starts can add latency.  
- Using containerized Postgres (as in this repo) avoids managed DB cost but data is ephemeral unless you attach a persistent disk or use an external DB.  
- For a production app you would typically use Render (or another provider) managed PostgreSQL and keep the backend Dockerized.

Configuration on Render is done **only via the Environment tab**; do not commit `.env` or any real secrets.

---

## Environment variables

Set these in `.env` locally or in Render’s Environment UI. **No values below are real secrets; do not commit actual credentials.**

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_NAME` | Yes | PostgreSQL database name |
| `DB_USER` | Yes | PostgreSQL user |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_HOST` | In Docker | Set to `db` (service name); Compose sets this for the backend |
| `DB_PORT` | No | Default `5432` |
| `SECRET_KEY` | Yes | Django secret key (generate a new one for production) |
| `DEBUG` | No | Set to `False` in production |
| `ALLOWED_HOSTS` | Production | Comma-separated hosts, e.g. `your-app.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | If needed | Comma-separated frontend origins |
| `FIREBASE_PROJECT_ID` | If using Firebase | Firebase project ID |
| `FIREBASE_CREDENTIALS` | If using Firebase | Path to service account JSON or inline JSON string (never commit real file) |
| `GOOGLE_CLIENT_ID` | Optional | For “Continue with Google” |
| `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET` | Optional | Image uploads |
| `CHAPA_*` | Optional | Payment gateway |
| `REDIS_URL` | Optional | Caching (if not set, in-memory cache is used) |

See **`.env.example`** at the project root for the full list and short comments.

---

## Portfolio note

This repository is a **portfolio/demo project**.  

- **PostgreSQL is run in Docker** (with a named volume for `/var/lib/postgresql/data`) to keep the stack self-contained and to avoid depending on a paid managed database on the free tier.  
- For a real production deployment, you would typically switch to a managed PostgreSQL service and keep the backend Dockerized; the same environment variables (`DB_*`) are used.  
- No secrets, API keys, or credentials are committed; the repo is intended to be safe to make public.

---

## License

Proprietary.
