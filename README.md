# BarberBook – Barbershop Management System

A full-stack barbershop booking platform: find shops, book services, buy products, and manage appointments. Branded as **BarberBook** in the client. Built for customers and shop owners with dark/light theme, Cloudinary image uploads, Chapa payments, and production-ready UX.

---

## Value Proposition

- **Customers:** Browse shops, book services, buy products, pay via Chapa, leave reviews, and manage appointments—all in one app with dark mode and consistent toasts.
- **Owners:** Manage barbershops, staff, services, products, bookings, and payments from an admin dashboard with clear flows and error handling.

---

## Key Features

| Area | Features |
|------|----------|
| **Auth** | Email/password signup & login (with optional profile photo), JWT persistence, optional Firebase (Google/Apple), 401 handling with redirect to login |
| **Booking** | Service selection, barber/slot picker, calendar, booking creation, my-appointments, cancellation |
| **Cart & Payments** | Add services/products to cart, checkout, Chapa integration (booking & order payments), payment verification |
| **Reviews** | Star ratings, rating breakdown, write review modal, review display on shop profile |
| **Images** | Cloudinary uploads for profile pics, barbershop logos, services, products; consistent web/native upload and double-submit prevention |
| **UX** | Dark/light theme (ThemeContext), app-wide toasts (ToastProvider), optimized images (Cloudinary), error boundaries, loading/skeleton states |
| **Owner** | Dashboard, manage services/products/bookings/payments/staff, barbershop enrollment, staff invitations |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Client** | React Native (Expo SDK 54), React Navigation, Axios, AsyncStorage, Expo Notifications, react-native-maps, react-native-calendars |
| **Backend** | Django 4.2, Django REST Framework, PostgreSQL, Redis (cache), Gunicorn |
| **Auth** | djangorestframework-simplejwt, Firebase Admin SDK (optional social login) |
| **Storage** | Cloudinary (media), django-cloudinary-storage |
| **Payments** | Chapa (webhook + verify flow) |
| **API** | drf-spectacular (OpenAPI/Swagger), djangorestframework-camel-case (camelCase JSON) |
| **Optional** | Celery + django-celery-beat (booking reminder pushes) |

---

## Project Structure

```
BSBS_UPDATED/
├── backend/           # Django API (accounts, barbershops, services, bookings, payments, notifications)
├── client/             # Expo (React Native) app
│   ├── assets/         # App icon, splash, favicon, banners, fallback images
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   └── utils/          # Shared helpers (e.g. imageUpload for Cloudinary)
├── docker-compose.yml  # PostgreSQL, Redis, Django backend
├── .env                # Not committed; copy from .env.example
└── README.md
```

---

## How to Run Locally

### Prerequisites

- **Docker:** Docker Desktop or Docker Engine + Docker Compose  
- **Or manual:** Python 3.10+, Node 18+, PostgreSQL 12+, Redis (optional)

### 1. Clone and enter project

```bash
git clone <repo-url>
cd BSBS_UPDATED
```

### 2. Environment

- Copy root **`.env.example`** to **`.env`** at the **project root** (same folder as `docker-compose.yml`).
- Set at least: `SECRET_KEY`, `DEBUG`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Optionally: `DB_HOST`, `DB_PORT`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET`, `CHAPA_*`, `FIREBASE_*`, `REDIS_URL`.

### 3. Run backend with Docker (recommended)

```bash
docker compose up --build
```

In another terminal, create an admin user:

```bash
docker compose exec backend python manage.py createsuperuser
```

- **API:** http://localhost:8000  
- **Admin:** http://localhost:8000/admin/  
- **Swagger:** http://localhost:8000/api/docs/

### 4. Run the client

```bash
cd client
cp .env.example .env   # optional: set EXPO_PUBLIC_API_URL for device testing
npm install
npm start
```

Then use Expo Go (scan QR), or press **w** for web at http://localhost:8081, or `npm run android` / `npm run ios`.

### Manual backend (no Docker)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Client: in `client/`, set API base URL in `config.js` (or `.env` with `EXPO_PUBLIC_API_URL`), then `npm install` and `npm start`.

---

## Environment Variables

**Root `.env` (backend / Docker):**

- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET` — for profile pics, logos, services, products
- `CHAPA_SECRET_KEY`, `CHAPA_PUBLIC_KEY`, `CHAPA_WEBHOOK_SECRET`
- `FIREBASE_*` (if using Firebase auth)
- `REDIS_URL` (optional)

**Client (optional `.env`):**

- `EXPO_PUBLIC_API_URL` — API base URL (no trailing slash); use LAN IP when testing on a physical device.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — for Google sign-in.
- `EXPO_PUBLIC_FORCE_WELCOME` — set to `true` to always show welcome screen (e.g. for demos).

**Never commit real secrets.** `.env` is in `.gitignore`.

---

## Screens & Flows

**Customer:** Welcome → Login/Register → Home → Explore shops / Services / Products → Book service (slot selection) → Cart → Checkout → Payments (Chapa) → Confirmation; Account (profile, my appointments, my orders, notifications); Shop public profile & reviews.

**Owner / Admin:** Dashboard → Manage Services, Products, Bookings, Payments, Barbers; Staff enrollment (invite, join barbershop); barbershop registration and preferences.

---

## Preparing for Git Push

Before pushing to a remote repository:

1. **Do not commit secrets.** Ensure `.env` is listed in `.gitignore` (it is by default). Never commit API keys, `SECRET_KEY`, or database passwords.
2. **Use `.env.example` as a template.** Commit `.env.example` with placeholder values; teammates copy it to `.env` and fill in real values locally.
3. **Check ignored paths.** The repo ignores `node_modules/`, `venv/`, `__pycache__/`, `.expo/`, `web-build/`, and other build/cache artifacts.
4. **Optional: pre-push checks.** Run tests or lint if you have them (e.g. `cd backend && python manage.py check`, `cd client && npm run lint` if configured).

Example first push:

```bash
git add .
git status   # confirm no .env or sensitive files
git commit -m "Initial commit: BarberBook full-stack app"
git remote add origin <your-remote-url>
git push -u origin main
```

---

## Production Notes

- **Error handling:** API client centralizes error messages; ErrorBoundary and toasts for user feedback.
- **Theming:** ThemeContext (light/dark); StatusBar and navigation follow theme.
- **Images:** Cloudinary for uploads; shared `getFileForFormData` in `client/utils/imageUpload.js` for web/native consistency; submit buttons use loading/disabled to prevent double uploads.
- **API:** OpenAPI at `/api/docs/`, camelCase responses, CORS configured; Chapa webhook and verify for payments.
- **Deploy:** Set `DEBUG=False`, configure `ALLOWED_HOSTS` and production DB/Redis; build mobile with Expo EAS or `expo build`.

---

## License

Proprietary.
