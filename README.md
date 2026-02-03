# BarberBook

A full-stack barbershop booking platform: find shops, book services, buy products, and manage appointments. Built for customers and shop owners, with Firebase auth, optional Cloudinary media, and Chapa payments.

---

## Project overview

**What it is:** BarberBook is a mobile-first (React Native/Expo) and web-capable app backed by a Django REST API. Customers browse barbershops, book services, add products to cart, pay via Chapa, and manage appointments. Owners manage shops, staff, services, products, bookings, and payments from an admin dashboard.

**Problem it solves:** Centralizes discovery, booking, payments, and management for barbershops in one place, with a single API and shared auth (Firebase) and optional media (Cloudinary).

**Secrets:** No secrets or credentials are hardcoded. Database, CORS, allowed hosts, Firebase, Chapa, and Cloudinary are driven entirely by environment variables.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| **Backend** | Django 4.2, Django REST Framework, Gunicorn, WhiteNoise |
| **Database**| PostgreSQL (PostGIS optional); locally via Docker, on Render via Render PostgreSQL |
| **Auth**    | Firebase (identity); Firebase Admin SDK (token verification); PostgreSQL (user/role store) |
| **Media**   | Cloudinary (optional) or local files; production can use S3 instead |
| **Payments**| Chapa (optional) |
| **Deployment** | Local: Docker Compose. Production: Render (Docker + Render free-tier PostgreSQL) |
| **Client**  | React Native (Expo) – separate or in `client/`; consumes this API |

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │  Client (React Native / Expo)       │
                    │  Mobile & Web                       │
                    └─────────────────┬───────────────────┘
                                      │ HTTPS / REST
                                      ▼
                    ┌─────────────────────────────────────┐
                    │  Backend API (Django + Gunicorn)    │
                    │  :8000 | WhiteNoise static          │
                    └─────┬───────────────────┬───────────┘
                          │                   │
          ┌───────────────┘                   └───────────────┐
          ▼                                                   ▼
┌─────────────────────┐                         ┌─────────────────────┐
│  PostgreSQL         │                         │  Firebase Auth       │
│  Local: Docker `db` │                         │  Token verification  │
│  Render: Render PG  │                         │  & user sync         │
└─────────────────────┘                         └─────────────────────┘
```

- **Client → Backend:** Configure via env (e.g. `EXPO_PUBLIC_API_URL`). No secrets in repo.
- **Backend → PostgreSQL:** Uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. Local Docker: `DB_HOST=db`. Render: set from Render PostgreSQL.
- **Backend → Firebase:** `FIREBASE_PROJECT_ID`, `FIREBASE_CREDENTIALS` (path or inline JSON).

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
   - Copy the root `.env.example` to `.env` in the project root.
   - Set at least: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
   - For local dev, `DB_HOST` is set by Compose to `db`; you can leave it in `.env` as `db`.
   - Optional: `DEBUG=True`, `ALLOWED_HOSTS=localhost,127.0.0.1`, `LOG_TO_FILE=true`.

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

5. **Run the client (optional)**
   ```bash
   cd client
   cp .env.example .env   # set EXPO_PUBLIC_API_URL to http://<your-ip>:8000/api for device
   npm install
   npm start
   ```

---

## Render deployment

The backend runs on Render as a **Web Service** using the **Dockerfile** in `backend/`. It does **not** use Docker Compose on Render; it connects to **Render’s free-tier PostgreSQL** via environment variables.

### 1. Create a PostgreSQL database on Render

1. In [Render Dashboard](https://dashboard.render.com/), click **New +** → **PostgreSQL**.
2. Create a **Free** instance (e.g. name `barbershop-db`).
3. After creation, open the database and note:
   - **Internal Database URL** (use this for env vars, or the individual fields below).
   - Or use: **Host**, **Port**, **Database**, **User**, **Password**.

### 2. Create a Web Service (backend)

1. **New +** → **Web Service**.
2. Connect your repo and set:
   - **Root Directory:** `backend` (so the build context is the backend folder).
   - **Environment:** Docker.
   - **Dockerfile Path:** `Dockerfile` (relative to Root Directory).

3. **Environment variables** (set in the Render service **Environment** tab):

   | Variable | Required | Example / notes |
   |----------|----------|------------------|
   | `DB_HOST` | Yes | From Render Postgres: **Internal Host** |
   | `DB_PORT` | Yes | Usually `5432` |
   | `DB_NAME` | Yes | Render Postgres database name |
   | `DB_USER` | Yes | Render Postgres user |
   | `DB_PASSWORD` | Yes | Render Postgres password |
   | `SECRET_KEY` | Yes | New Django secret (e.g. `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
   | `DEBUG` | No | `False` |
   | `ALLOWED_HOSTS` | Yes | `your-service-name.onrender.com` |
   | `CORS_ALLOWED_ORIGINS` | If needed | `https://your-frontend.onrender.com,https://yourapp.com` |
   | `FIREBASE_PROJECT_ID` | If using Firebase | Your project ID |
   | `FIREBASE_CREDENTIALS` | If using Firebase | Inline JSON string of service account key (no file on Render) |
   | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET` | Optional | For media uploads |
   | `CHAPA_*` | Optional | Payment gateway |

   Do **not** commit `.env` or real secrets; set everything in Render’s UI.

4. **Build & Deploy:** Render will build the Docker image from `backend/Dockerfile` and run:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
   ```
   The entrypoint will wait for the database, run migrations, collect static files, then start Gunicorn. Static files are served by WhiteNoise (no volume needed).

### 3. After first deploy

- Open **https://your-service-name.onrender.com/admin/** and create a superuser (use Render **Shell** or a one-off command if available):
  ```bash
  python manage.py createsuperuser
  ```

---

## Free-tier limitations (portfolio / demo)

- **Render free Web Service:** Spins down after inactivity; cold starts can add latency.
- **Render free PostgreSQL:** Limited storage and connections; suitable for demos and portfolios.
- **No persistent disk:** Backend container is ephemeral; use Render PostgreSQL for data and Cloudinary (or S3) for media in production.
- For production traffic and data, consider paid plans and managed PostgreSQL.

---

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | PostgreSQL host (`db` in local Docker, Render internal host on Render) |
| `DB_PORT` | No | Default `5432` |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `SECRET_KEY` | Yes | Django secret key (generate a new one for production) |
| `DEBUG` | No | `False` in production |
| `ALLOWED_HOSTS` | Production | Comma-separated (e.g. `your-app.onrender.com`) |
| `CORS_ALLOWED_ORIGINS` | If needed | Comma-separated frontend origins |
| `FIREBASE_PROJECT_ID` | If using Firebase | Firebase project ID |
| `FIREBASE_CREDENTIALS` | If using Firebase | Path to service account JSON or inline JSON (on Render use inline) |
| `GOOGLE_CLIENT_ID` | Optional | For “Continue with Google” |
| `CLOUDINARY_*` | Optional | Image uploads |
| `CHAPA_*` | Optional | Payment gateway |
| `REDIS_URL` | Optional | Caching (if unset, in-memory cache) |
| `LOG_TO_FILE` | Optional | `true` for local file logs; omit on Render |

See **`.env.example`** at the project root for the full list.

---

## Validation

- **Local:** Run `docker compose up --build`; backend uses Dockerized Postgres via `DB_HOST=db` and env from `.env`. Create superuser and use API at http://localhost:8000.
- **Render:** Deploy backend as Docker Web Service; add Render PostgreSQL and set all `DB_*` and other env vars in the Render dashboard. Backend starts with Gunicorn and connects to Render Postgres; no Compose or local `.env` on the server.
- **Secrets:** No `.env` or credential files are committed; `.gitignore` and `.dockerignore` exclude env files and Firebase credentials.

---

## License

Proprietary.
