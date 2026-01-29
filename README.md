# Barbershop Management System

Full-stack application for barbershop operations: service bookings, product sales, and appointments. Backend: Django REST Framework. Frontend: React Native (Expo). Serves a mobile app and supports multi-tenant barbershops.

## Stack

- **Backend:** Django 4.x, DRF, PostgreSQL, Redis, Gunicorn
- **Auth:** JWT, Firebase social login
- **Storage:** Cloudinary (media)
- **Payments:** Chapa
- **API docs:** OpenAPI / Swagger (drf-spectacular)

## Prerequisites

- **Docker:** Docker Desktop or Docker Engine + Docker Compose
- **Manual:** Python 3.10+, Node 16+, PostgreSQL 12+, Redis (optional)

## Setup and run

### Docker (recommended)

1. Clone and go to project root:
   ```bash
   git clone <repo-url>
   cd BSBS_UPDATED
   ```

2. Add a `.env` at **project root** (same folder as `docker-compose.yml`). Copy from root `.env.example` and set at least:
   - `SECRET_KEY`, `DEBUG`
   - `DB_NAME`, `DB_USER`, `DB_PASSWORD` (and optionally `DB_HOST`, `DB_PORT`)
   - `CLOUDINARY_*`, `CHAPA_*`, `FIREBASE_*` as needed.

3. Start stack:
   ```bash
   docker compose up --build
   ```

4. Create an admin user (in another terminal):
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

5. Open:
   - API: http://localhost:8000
   - Admin: http://localhost:8000/admin/
   - Swagger: http://localhost:8000/api/docs/

Migrations run on backend startup. DB and Redis use the same `.env` via Compose; backend overrides `DB_HOST` and `REDIS_URL` for the Docker network.

**Useful commands:**
- Background: `docker compose up -d`
- Logs: `docker compose logs -f backend`
- Stop: `docker compose down`
- Stop and remove data: `docker compose down -v`
- Run management commands: `docker compose exec backend python manage.py <command>`

### Manual (no Docker)

1. **Backend:** Create and activate a venv, install deps (`pip install -r backend/requirements.txt`). Add a `.env` at **project root** (Django loads `BASE_DIR.parent / ".env"`). Create the Postgres DB, then:
   ```bash
   cd backend
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

2. **Client:** In `client/`, set the API base URL in `config.js`, then `npm install` and `npm start` (Expo).

## Project layout

```
├── backend/          # Django API (accounts, barbershops, services, bookings, payments, notifications)
├── client/           # React Native (Expo) app
├── docker-compose.yml
├── .env.example      # Template for root .env
└── README.md
```

## Environment

Use a single `.env` at **project root**. Required for backend: `SECRET_KEY`, `DEBUG`, `DB_*`. Optional: `CLOUDINARY_*`, `CHAPA_*`, `FIREBASE_*`, `REDIS_URL`. See root `.env.example`. Never commit `.env` (it is in `.gitignore`).

## API overview

- **Auth:** `POST /api/customers/signup`, `POST /api/customers/login`, `POST /api/customers/firebase-login`, `GET /api/customers/profile`
- **Services:** `GET /api/service/get-all`, `POST /api/service/create`, `GET /api/service/<id>`
- **Products:** `GET /api/product/get-all`, `POST /api/product/create`
- **Bookings:** `POST /api/booking/create`, `GET /api/booking/availability`, `GET /api/booking/get-all`
- **Orders:** `POST /api/order/create`, `GET /api/order/my-orders`
- **Payments:** `POST /api/booking/payments`, `POST /api/order/payments`, `POST /api/payments/verify`, `POST /api/payments/webhook/chapa`
- **Docs:** `GET /api/docs/` (Swagger), `GET /api/redoc/`, `GET /api/schema/`

Roles: Customer, Barber, Admin. Multi-tenant via `X-Barbershop-Id` (or subdomain/user default).

## Deployment

Set `DEBUG=False`, configure `ALLOWED_HOSTS` and production DB/Redis in `.env`. Use a reverse proxy (e.g. Nginx) for HTTPS and static files, or keep serving static in Django only when `DEBUG=True`. Build the mobile app with Expo/EAS.

## License

Proprietary.
