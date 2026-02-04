# BarberBook

A full-stack barbershop booking platform: find shops, book services, buy products, and manage appointments. Built for customers and shop owners, with Django JWT auth, optional Cloudinary media, and Chapa payments.

---

## Project overview

**What it is:** BarberBook is a mobile-first (React Native/Expo) and web-capable app backed by a Django REST API. Customers browse barbershops, book services, add products to cart, pay via Chapa, and manage appointments. Owners manage shops, staff, services, products, bookings, and payments from an admin dashboard.

**Tech stack:**

| Layer        | Technology |
|-------------|------------|
| **Backend** | Django 4.2, Django REST Framework, Simple JWT, Gunicorn, WhiteNoise |
| **Database**| PostgreSQL; locally via Docker, on Render via Render PostgreSQL |
| **Auth**    | Django JWT (register, login, email verification, password reset, guest login); optional Google OAuth |
| **Media**   | Cloudinary (optional) or local files |
| **Payments**| Chapa (optional) |
| **Deployment** | Local: Docker Compose. Production: Render (Docker + Render PostgreSQL) |
| **Client**  | React Native (Expo) in `client/`; consumes this API |

---

## Auth (Django JWT)

The app uses **Django-native auth** only (no Firebase). Main endpoints under `/api/auth/`:

| Action | Method | Path |
|--------|--------|------|
| Register | POST | `auth/register/` — `first_name`, `last_name`, `email`, `password`; account inactive until email verified |
| Login | POST | `auth/login` — `email`, `password`; returns `token` + `refresh` |
| Verify email | GET/POST | `auth/verify-email/<token>/` |
| Password reset | POST | `auth/password-reset/` then `auth/password-reset/confirm/` with `token`, `new_password` |
| Guest login | POST | `auth/guest-login/` — optional `name` |
| Refresh token | POST | `auth/token/refresh/` — body `{ "refresh": "<refresh_token>" }` |

The client stores JWT access + refresh in AsyncStorage; `api.js` attaches `Authorization: Bearer <token>` and retries once with a new access token on 401.

**Backend env for email (verification, password reset):**  
`EMAIL_VERIFICATION_BASE_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`. See root `.env.example`.

---

## Local development

### Prerequisites

- Docker and Docker Compose (for backend + DB)
- Node 18+ and npm (for client)

### 1. Backend with Docker Compose

```bash
git clone <repo-url>
cd BSBS_UPDATED
```

- Copy root `.env.example` to `.env` and set at least `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- For local dev, `DB_HOST=db` is used by Compose.

```bash
docker compose up --build
```

- **API:** http://localhost:8000  
- **Admin:** http://localhost:8000/admin/  
- **Docs:** http://localhost:8000/api/docs/

Create a superuser (first time):

```bash
docker compose exec backend python manage.py createsuperuser
```

On Render, the `create_admin` command runs from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) if set.

### 2. Client (Expo)

```bash
cd client
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to http://<your-ip>:8000/api for physical device; omit for production URL
npm install
npx expo start
```

---

## Render deployment

1. **PostgreSQL:** Create a free PostgreSQL instance on Render; note Internal Database URL or Host/Port/Name/User/Password.
2. **Web Service:** New Web Service, connect repo, **Root Directory** `backend`, **Environment** Docker.
3. **Environment variables** (in Render dashboard):

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes | From Render Postgres |
   | `SECRET_KEY` | Yes | Generate a new Django secret |
   | `DEBUG` | No | `False` |
   | `ALLOWED_HOSTS` | Yes | `your-service.onrender.com` (or use `RENDER_EXTERNAL_HOSTNAME` automatically) |
   | `CORS_ALLOWED_ORIGINS` | If needed | Comma-separated frontend origins |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional | One-time admin bootstrap |
   | `EMAIL_VERIFICATION_BASE_URL` | For auth emails | Base URL for verification/reset links (e.g. your API or app URL) |
   | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | For SMTP | Or leave unset to print emails to console |
   | `GOOGLE_CLIENT_ID` | Optional | For “Continue with Google” |
   | `CLOUDINARY_*`, `CHAPA_*` | Optional | Media and payments |

4. Deploy; the Dockerfile uses `PORT` from Render for the listening port.

---

## Environment reference

See **`.env.example`** at the project root for the full list. Do not commit `.env` or secrets.

---

## License

Proprietary.
