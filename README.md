# BarberBook

Barbershop booking and management system: mobile-first client (Expo/React Native) and Django REST API. Customers discover shops, book services, manage appointments; owners manage shops, staff, services, products, and payments.

---

## System Overview

- **Backend:** Django 4.2, DRF, Simple JWT, Gunicorn, WhiteNoise. PostgreSQL (PostGIS for geo). Optional: Cloudinary (media), Chapa (payments).
- **Client:** React Native (Expo SDK 54) in `client/`. Consumes backend API; supports Android, iOS, web.
- **Auth:** Django JWT (email/password, email verification, password reset, guest). Optional Google OAuth via Expo AuthSession; backend verifies ID token with `GOOGLE_CLIENT_ID`.
- **Deployment:** Backend: Docker on Render (or local Docker Compose). Client: EAS Build / Expo.

---

## Architecture

```
client/          Expo app (React Native)
backend/         Django project (config/, accounts/, barbershops/, services/, bookings/, payments/, notifications/)
docker-compose.yml   Local: backend + PostgreSQL
```

API base path: `/api/`. Auth: `/api/auth/` (register, login, token refresh, guest, Google). Resources: barbershops, services, bookings, orders, payments. Multi-tenant by barbershop; role-based access (Customer, Barber, Admin) enforced in views.

---

## Tech Stack

| Layer     | Technology |
|----------|------------|
| Backend  | Django 4.2, DRF, Simple JWT, Gunicorn, WhiteNoise, CORS, Cloudinary (optional), Chapa (optional) |
| Database | PostgreSQL (PostGIS); Docker for local, Render Postgres for production |
| Auth     | Django JWT; optional Google OAuth (Expo AuthSession + backend ID token verification) |
| Client   | React Native, Expo 54, React Navigation, Axios |

---

## Environment Setup

### Backend (root)

Copy root `.env.example` to `.env`. Required: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. For local Docker: `DB_HOST=db`. Set `DEBUG=False` and `ALLOWED_HOSTS` for production.

### Client (`client/`)

Copy `client/.env.example` to `client/.env`. For local dev on a physical device set `EXPO_PUBLIC_API_URL=http://<YOUR_IP>:8000/api`. Omit or use production URL for production builds.

---

## Environment Variables

### Root (backend / Docker Compose)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes | PostgreSQL connection |
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | Set to `False` in production |
| `ALLOWED_HOSTS` | Yes (prod) | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated API consumer origins |
| `GOOGLE_CLIENT_ID` | For Google OAuth | Web client ID (same as Expo OAuth client) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional | One-time admin bootstrap on Render |
| `EMAIL_*`, `EMAIL_VERIFICATION_BASE_URL` | Optional | SMTP and verification link base URL |
| `CLOUDINARY_*`, `CHAPA_*` | Optional | Media and payment providers |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | No | API base URL (no trailing slash). Unset = production URL |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For Google OAuth | Google OAuth web client ID |
| `EXPO_PUBLIC_ANDROID_CLIENT_ID` | For Google OAuth (Android) | Android OAuth client ID |
| `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` | No | Override redirect URI (default: `https://auth.expo.io/@mullervic/barberbook`) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | For map on Android | Google Maps SDK key |
| `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL` | No | Links for register/terms |
| `EXPO_PUBLIC_FORCE_WELCOME` | No | `true` to always show Welcome (ignores stored token) |

Do not commit `.env` or any file containing secrets.

---

## Running Locally

**Backend (Docker):**

```bash
# From repo root: copy .env.example to .env, set DB_* and SECRET_KEY
docker compose up --build
```

API: http://localhost:8000  
Admin: http://localhost:8000/admin/  
Docs: http://localhost:8000/api/docs/

Create superuser: `docker compose exec backend python manage.py createsuperuser`

**Client:**

```bash
cd client
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://<YOUR_IP>:8000/api for device
npm install
npx expo start
```

---

## Docker

- **Local:** `docker compose up --build` runs backend + PostgreSQL. Root `.env` is used; do not commit it.
- **Production (Render):** Deploy `backend/` as a Web Service (Dockerfile in `backend/`). Use Render PostgreSQL; set all env vars in Render dashboard. Do not use this Compose file on Render.

---

## Build Steps

**Backend:** Image build via `backend/Dockerfile`. No separate front-end build; static files served by WhiteNoise.

**Client:** Development: `npx expo start`. Production builds: use EAS (`eas build --platform android`, etc.). Env for EAS is configured in `client/eas.json` (e.g. preview/production profiles).

---

## Deployment Notes

- **Render:** Web Service from `backend/`, Environment = Docker. Add Render Postgres; set `DB_*`, `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS` (or `RENDER_EXTERNAL_HOSTNAME`). Optional: `ADMIN_EMAIL`/`ADMIN_PASSWORD` for bootstrap, `GOOGLE_CLIENT_ID`, `CORS_ALLOWED_ORIGINS`, email and payment vars.
- **Client:** Build with EAS; point `EXPO_PUBLIC_API_URL` to production API or leave unset to use default production URL in `client/config.js`.

---

## Authentication

- **Email/password:** Register → email verification (if configured) → login. JWT access + refresh; client stores in AsyncStorage; `Authorization: Bearer <access>` on requests; 401 triggers refresh then retry.
- **Google OAuth:** Client uses Expo AuthSession with `useProxy: true`. Redirect URI must be `https://auth.expo.io/@mullervic/barberbook` (or `EXPO_PUBLIC_GOOGLE_REDIRECT_URI`). This URI must be added to the Google Cloud OAuth client (Web application type). Client sends ID token to backend `POST /api/auth/social/google/`; backend verifies with `GOOGLE_CLIENT_ID` and returns JWT. Use Web client ID for Expo proxy; use Android client ID for Android native builds where required.

---

## API Base URLs

- **Production (default in client):** `https://barbershop-management-system-xxv5.onrender.com/api`
- **Local:** `http://<host>:8000/api` (set `EXPO_PUBLIC_API_URL` in client `.env`)

---

## Security

- **Secrets:** Never commit `.env` or credentials. Backend uses `SECRET_KEY` and env-only config; client uses `EXPO_PUBLIC_*` for non-secret config only.
- **JWT:** Access token expiry and refresh flow; refresh stored securely on client; backend can blacklist tokens (token_blacklist).
- **OAuth:** Google ID token verified on backend with `GOOGLE_CLIENT_ID`; no client-side secret. Redirect URI fixed to Expo auth proxy (or explicit override) to avoid redirect abuse.
- **RBAC:** User roles (Customer, Barber, Admin); views use `IsAuthenticated`, `IsAdminUser`, and barbershop-scoped permissions (`IsBarbershopAdmin`, `IsBarbershopOwner`). Admin-only and owner-only actions enforced in backend.
- **CORS:** Set `CORS_ALLOWED_ORIGINS` to allowed front-end origins in production.
- **DEBUG:** Must be `False` in production.

---

## License

Proprietary.
