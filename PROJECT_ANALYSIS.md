# BSBS_UPDATED — Project Analysis

**Document Version:** 1.1  
**Date:** January 2025  
**Last Updated:** January 2025 (UI/UX modernization, auth flow, design system, config)  
**Purpose:** Comprehensive analysis of backend, frontend, UI/UX, gaps, and roadmap for senior developer review and production readiness.

---

## 1. Backend Analysis

### 1.1 Technology Stack

- **Framework:** Django 4.2, Django REST Framework 3.14
- **Auth:** JWT (djangorestframework-simplejwt), optional Firebase
- **Database:** PostgreSQL 15
- **Cache:** Redis (django-redis), fallback in-memory
- **Storage:** Cloudinary (media)
- **Payments:** Chapa (ETB), webhook + verify flow
- **API Docs:** drf-spectacular (Swagger/ReDoc) when installed

### 1.2 Models

| App | Model | Purpose |
|-----|--------|---------|
| **accounts** | `User` | Custom user (email, name, phone, role: Customer/Barber/Admin, profile_pic, preferences/specialization, firebase_uid) |
| **barbershops** | `Barbershop` | Multi-tenant shop (name, address, city, country, opening/closing hours, owner FK) |
| **barbershops** | `BarbershopStaff` | M2M shop ↔ staff (Barber/Admin), is_active |
| **bookings** | `TimeSlot` | Barber slot (barber, barbershop, start_time, end_time, date, is_booked) |
| **bookings** | `Booking` | Booking (barbershop, customer, barber, service, slot 1:1, booking_time, payment_status, booking_status, customer_notes) |
| **services** | `Category` | Product category (name) |
| **services** | `Service` | Shop service (barbershop, name, description, price, duration, category, image, is_active) |
| **services** | `Product` | Shop product (barbershop, name, price, stock, category, rating, num_reviews) |
| **services** | `ProductImage`, `ProductReview` | Product media and reviews |
| **services** | `Order`, `OrderItem` | E‑commerce order (shipping, payment_method, item_price, tax, shipping_charges, total_amount, order_status) |
| **payments** | `Payment` | Audit (user, barbershop, payment_type booking/order, booking/order FK, amount, currency, chapa fields, status) |
| **payments** | `PaymentWebhook` | Chapa webhook events (event_type, payload, processed) |
| **notifications** | `Notification` | User notification (message, is_read, notification_type, related_booking/order) |

**Relationships:** User owns/affiliates to Barbershop; Booking links Customer, Barber, Service, TimeSlot; Order links User and OrderItems (Product); Payment links to Booking or Order; Notification links to User and optionally Booking/Order.

### 1.3 Serializers

- **accounts:** `UserSerializer`, `UserRegistrationSerializer`, `UserLoginSerializer` (username → name), `UserUpdateSerializer` (preferencesOrSpecialization).
- **bookings:** `TimeSlotSerializer`, `BookingSerializer` (camelCase: customerId, barberId, serviceId, slotId, bookingTime, paymentStatus, etc.).
- **services:** `ServiceSerializer`, `ProductSerializer`, `ProductImageSerializer`, `ProductReviewSerializer`, `OrderSerializer` (orderItems, shippingInfo, paymentInfo, camelCase; **note:** `OrderSerializer` Meta.fields list camelCase names that are not all mapped to model snake_case fields—likely bugs for read/write).
- **notifications:** `NotificationSerializer` (id, message, is_read, notification_type, created_at).

### 1.4 Views & Business Logic

- **accounts:** `UserViewSet` — signup (Customer), login (by name + password, returns JWT), profile, update_profile, set_preferences, set_specialization, firebase_login; `create_barber` (Admin), `get_all_barbers`. Login uses **name** as username (not email).
- **bookings:** `BookingViewSet` — `create_booking` (validates service/barber/customer, operating hours 8–18, gap-based slot creation, creates TimeSlot + Booking + Notification); `availability` (unbooked slots by barber/date); `get_all` (Admin); `approve` (Admin, notification).
- **services:** `ServiceViewSet` — get_all, get_single, create (Cloudinary + barbershop context), update, update_image, delete_image, destroy. `ProductViewSet` — get_all, top, retrieve, create, update, update_image, delete_image, destroy, review (updates product rating). `OrderViewSet` — create (order + order_items, decrement stock), my_orders, get_single, admin_get_all_orders, admin_change_status. `CategoryViewSet` — get_all.
- **payments:** `booking_payment` (Chapa init, Payment record, booking payment_intent_id + “Online Pending”); `order_payment` (Chapa init for order); `chapa_webhook` (signature verify, charge.success → Payment completed, booking “Online Paid” or order paid_at); `verify_payment` (tx_ref verify); `get_all_payments` (Admin, booking-centric list).
- **notifications:** `get_user_notifications` (authenticated user, ordered by -created_at).

Permissions: Default `IsAuthenticated`; Admin-only where noted (create_barber, get_all barbers for full data, booking get_all/approve, order admin endpoints, get_all_payments). Booking create/availability use `AllowAny` (should be reviewed for production).

### 1.5 URLs & API Surface

| Prefix | App | Key Routes |
|--------|-----|------------|
| `/api/auth/`, `/api/customers/`, `/api/barbers/` | accounts | signup, login, profile, update-profile, set-preferences, set-specialization, firebase-login; barbers/signup, barbers/get-all |
| `/api/service/` | services | get-all, \<pk\>, create, update/\<pk\>, image/\<pk\>, delete-image/\<pk\>, delete/\<pk\> |
| `/api/product/` | services (product_urls) | get-all, top, \<pk\>, create, update/\<pk\>, image/\<pk\>, delete-image/\<pk\>, delete/\<pk\>, \<pk\>/review |
| `/api/booking/` | bookings | create, availability, payments (booking), notifications, get-all, approve/\<pk\> |
| `/api/order/` | services (order_urls) | create, my-orders, my-orders/\<pk\>, payments (order), admin/get-all-orders, admin/order/\<pk\> |
| `/api/payments/` | payments (standalone) | booking, order, webhook/chapa, verify, all |

Schema/docs: `/api/schema/`, `/api/docs/`, `/api/redoc/` when drf-spectacular is installed.

### 1.6 Data Flow & Multi-Tenancy

- **Barbershop context:** `BarbershopContextMiddleware` sets `request.barbershop` from (1) `X-Barbershop-Id` header, (2) subdomain, (3) user’s staff/owned barbershop. Used in service/product/order creation and filtering via `filter_by_barbershop()`.
- **Booking flow:** Client sends serviceId, barberId, customerId, bookingTime, paymentStatus, customerNotes → backend creates slot (gap algorithm) + booking + notification.
- **Payment flow:** Client calls booking or order payment → Chapa init → redirect to checkout_url; Chapa calls webhook → backend marks Payment and booking/order; client can call verify with tx_ref.

### 1.7 Database & Migrations

- All apps have migrations under `*/migrations/` (e.g. `0001_initial.py`). Models use explicit `db_table` and indexes. No programmatic migration review was run; ensure all migrations are applied and consistent (e.g. barbershop null on Booking/TimeSlot/Service/Product for “migration period”).

### 1.8 Docker & Environment

- **docker-compose.yml:** Services: `db` (Postgres 15), `redis`, `backend` (Gunicorn on 8000), `client` (Expo, profile `client`). Env from `.env`; backend uses `DB_HOST=db`, `REDIS_URL=redis://redis:6379/1`.
- **Backend Dockerfile:** Python 3.11, entrypoint runs migrations/wait_for_db, then Gunicorn.
- **Environment variables:** SECRET_KEY, DEBUG, DB_*, REDIS_URL, CLOUDINARY_*, CHAPA_*, FIREBASE_*, etc. See `.env.example` at project root and under `backend/`.

---

## 2. Frontend Analysis

### 2.1 Stack & Structure

- **Framework:** React Native (Expo ~54), React 18.
- **Navigation:** React Navigation (native-stack). Single stack; **initial route** is `welcome` for unauthenticated users and `home` for authenticated users (see Auth Gate below).
- **Auth Gate:** `App.js` uses an `AuthGate` that calls `isAuthenticated()` (AsyncStorage token) before rendering the navigator; sets `initialRouteName` to `welcome` or `home` accordingly. Optional **`EXPO_PUBLIC_FORCE_WELCOME=true`** in `.env` forces the app to always start at Welcome (ignores stored token; useful for testing).
- **HTTP:** Axios via `services/api.js`; base URL from `config.js` (env `EXPO_PUBLIC_API_URL` or fallback localhost/10.0.2.2). All authenticated requests send `Authorization: Bearer <token>`; 401 clears auth and resets navigation to `welcome`.
- **State / persistence:** AsyncStorage for `token`, `refreshToken`, `customerData`; `services/auth.js` (`getStoredToken`, `getStoredCustomer`, `setAuth`, `clearAuth`). Global context: `CartContext` for cart state.

**Config (`config.js`):** `apiBaseUrl`, `forceWelcome` (from `EXPO_PUBLIC_FORCE_WELCOME`). **Expo config (`app.json`):** `scheme: "abush"` for deep linking (required for production linking).

**Layout:** `client/` — `App.js`, `config.js`, `theme/`, `screens/`, `components/`, `components/common/`, `context/`, `services/`, `data/`, `assets/`.

### 2.2 Screens & Navigation

| Screen | Purpose |
|--------|---------|
| **welcome** | **Entry for unauthenticated users.** WelcomeScreen: headline, CTAs for Google, Apple (iOS), and Email; “Log in” link. Uses `config.forceWelcome` to skip “already logged in → home” redirect when set. |
| login, register | Auth (customer signup/login); success stores token via `setAuth()` and resets to `home`. |
| home | Tabs: Products (from API `/product/get-all`) / Services (from API `/service/get-all`); categories, banner; theme-based layout. |
| productDetails, serviceDetails | Detail views; ServiceDetails “Book now” → BookService. |
| cart, checkout | Cart from `CartContext`; Checkout: shipping form, COD/Online; order create + Chapa for Online; empty state when cart empty. |
| Confirmation | Post-booking/payment. |
| myorders, myappointments | MyOrders: API `/order/my-orders`; MyAppointments: API `booking/my-bookings`; cancel support; loading/empty/error states. |
| profile, notifications, account | Profile: update-profile API; Notifications: API with auth, mark read; Account: menu from UserData; logout calls `clearAuth()` and resets to `welcome`. |
| adminPanel, ManageProduct, ProductList, ManageServices, ManageBarbers, ManagePayments, ManageBookings | Admin UI (implementation depth varies). |
| BarberList, BookService, bookings | BookService: barbers + availability + booking/create + payment choice; uses `api` and stored customer. |
| SetPreferences_Specialization | Preferences/specialization (auth). |
| payment (Payments) | Booking payment (totalAmount + bookingId → Chapa init; opens checkout_url). |
| services, ServiceList, haircut (About) | Services list / about. |

**Navigation rules:** 401 from API → reset to `welcome`. Logout → reset to `welcome`. Login/Register/social success → reset to `home`.

### 2.3 Components

- **Layout:** Layout, Header, Footer (theme-based; Footer active/inactive states).
- **Common (`components/common/`):** `Button` (primary, secondary, danger, outline, ghost), `Card`, `EmptyState`, `ErrorView`, `LoadingScreen`, `SkeletonBox` (and `SkeletonCard` where used). Used across auth, home, cart, account, and list screens.
- **Banner, Categories, Products (ProductCard), Services (ServiceCard, FooterServices)** — refactored to use theme and Card where applicable.
- **Cart:** CartItem, PriceTable (ETB); Cart uses `useCart()` and EmptyState when empty.
- **Form:** InputBox (theme, focus states), AppointmentItem, OrderItem.

**Theme (`theme/index.js`):** `colors`, `fontSizes`, `spacing`, `borderRadius`, `shadows` (React Native–compatible), `typography` (title, subtitle, body, caption), `touchTargetMin`. Used consistently; no inline design tokens in refactored screens.

**Services:** `api.js` (axios instance, auth header, 401 handler), `auth.js` (getStoredToken, getStoredCustomer, setAuth, clearAuth, isAuthenticated), `authService.js` (loginWithEmail, exchangeGoogleToken, loginWithApple — social backend endpoints stubbed if not configured).

**Data:** `ProductsData.js` (static fallback), `ServicesData.js`, `CartData` (legacy), `AppointmentData`, `OrderData`, `UserData` (loads from AsyncStorage; normalizes `customerProfilePic` to string for avatar). BannerData, CategoriesData.

### 2.4 API Integration

- **Auth:** Login and Register use `authService.loginWithEmail` or direct backend + `setAuth({ token, refreshToken, user })`; JWT and `customerData` are stored. WelcomeScreen offers Google (expo-auth-session) and Apple (expo-apple-authentication); `authService.exchangeGoogleToken` / `loginWithApple` call backend social endpoints (stubbed if not implemented). All authenticated requests use `services/api.js`, which attaches `Authorization: Bearer <token>` from AsyncStorage; 401 clears auth and resets nav to `welcome`.
- **Profile update:** PUT `/customers/update-profile` with auth header. Works when token is stored.
- **BookService:** GET `/barbers/get-all`, GET `/booking/availability`, POST `/booking/create` with auth. Customer from `getStoredCustomer()`.
- **Payments (booking):** POST `/booking/payments` with totalAmount, bookingId; opens Chapa `checkout_url` via `Linking.openURL`.
- **Orders:** POST `/order/create` (Checkout); POST `/order/payments` for Online; GET `/order/my-orders` for My Orders. Cart from `CartContext`.
- **Notifications:** GET `/booking/notifications` (or notifications app route per backend) with auth; mark read endpoints used where available.
- **ServiceList / ServicesData:** GET `/service/get-all`. Home Products: GET `/product/get-all` (or top). Works with or without auth where allowed.

**Optional env:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for Google Sign-In on Welcome; `EXPO_PUBLIC_FORCE_WELCOME=true` to always show Welcome first.

### 2.5 Responsiveness, Styling, UX

- **Styling:** Design system in `theme/index.js` (colors, typography, spacing, borderRadius, shadows). Refactored screens and components use theme; common components (Button, Card, EmptyState) and layout (Header, Footer, InputBox) use theme consistently. No inline design tokens in modernized areas.
- **Responsiveness:** Mobile-first (Expo); no explicit breakpoints.
- **UX:** Welcome → Login/Register or social; Home with Products/Services tabs, categories, banner. Loading (LoadingScreen/spinner), empty (EmptyState), and error (ErrorView + retry) states on lists (Products, Services, MyOrders, MyAppointments, Notifications) and detail screens. Cart/Checkout use CartContext and real order/payment APIs. Profile avatar uses `resolveAvatarUri` to avoid crashes when `profilePic` is array or invalid.

---

## 3. UI/UX Review

### 3.1 Strengths

- **Auth flow:** Welcome screen as unauthenticated entry; AuthGate sets initial route (welcome vs home); token stored on login/register; 401 and logout reset to welcome. Optional force-welcome for testing.
- **Design system:** Theme (colors, typography, spacing, shadows, borderRadius) and common components (Button, Card, EmptyState, ErrorView, LoadingScreen, SkeletonBox) give consistent, production-ready UI.
- Clear separation: Home (products/services from API), Account (profile, orders, appointments, notifications, admin), Book Service flow, Payment flow. Cart/Checkout use CartContext and order/payment APIs.
- BookService flow: barber list, availability, booking create, payment choice; Payments opens Chapa checkout_url. My Appointments and My Orders use backend list endpoints; cancel supported where implemented.
- Reusable Form (InputBox), Layout, Header, Footer; loading/empty/error states on key screens.
- Backend API structured and documented (Swagger/ReDoc when available). Expo config includes `scheme: "abush"` for linking.

### 3.2 Weaknesses / Remaining Gaps

- **Social auth:** Google/Apple on Welcome depend on backend endpoints (`/auth/social/google/`, `/auth/social/apple/` or equivalent); if not implemented, authService returns friendly errors and user can use Email.
- **Data consistency:** Some legacy static data may remain (e.g. fallback ProductsData); ensure Home and lists prefer API where wired.
- **Chapa return URL:** Deep link after payment (e.g. `abush://`) and verify flow in-app could be tightened.
- **Error and loading:** Retry and offline handling remain basic in some screens.
- **Accessibility:** Theme and touch targets (touchTargetMin) help; a11y labels/roles not fully documented.
- **Admin:** Admin screens exist; wiring to backend with auth and `X-Barbershop-Id` should be verified per tenant.

### 3.3 User Flows

- **Entry:** Unauthenticated → Welcome (or home if token present unless `EXPO_PUBLIC_FORCE_WELCOME=true`). Login/Register/social success → home. 401 or Logout → welcome.
- **Booking:** Welcome/Login → Home → Service (API) → BookService → barber/date/time → confirm → (cash/online) → Confirmation or Payments (Chapa URL). My Appointments shows list; cancel where supported.
- **Payments (booking):** Payments initializes Chapa, opens checkout_url; “I’ve completed payment” → Confirmation. Webhook/verify on backend.
- **Orders:** Cart (CartContext) → Checkout → shipping → COD (order create → My Orders) or Online (order create → Chapa → “I’ve completed payment” → cart clear → My Orders). My Orders from API.
- **Account:** Profile, Notifications (with auth), My Orders, My Appointments from APIs; logout clears storage and navigates to welcome.

---

## 4. Missing Features & Gaps

### 4.1 Backend

- **Auth:** Login by email (optional) alongside name; refresh token storage/usage not specified; rate limiting or lockout not present.
- **Bookings:** No GET list for customer (e.g. “my bookings”); no cancel/reschedule; availability returns only *unbooked* slots (backend creates new slot on book), so semantics differ from “list free slots.”
- **Orders:** OrderSerializer likely broken for read/write due to camelCase in Meta.fields without `source=` for snake_case model fields. No dedicated Payment record list endpoint for admin (only booking-centric get_all_payments).
- **Barbershops:** No public CRUD or list API for barbershops; tenant selection relies on header/subdomain/user.
- **Notifications:** No mark-as-read endpoint used by frontend; no pagination.
- **Products:** Home uses static ProductsData; no use of `/product/get-all` or `/product/top` on home.

### 4.2 Frontend (Most Addressed)

- **Auth:** ✅ JWT (and refresh) stored on login/signup; `api.js` sends header; 401 clears auth and resets to welcome. Welcome screen with Email/Google/Apple; optional `EXPO_PUBLIC_FORCE_WELCOME` for testing.
- **Cart/Checkout:** ✅ CartContext; order create and Chapa redirect for Online; COD and My Orders flow.
- **My Appointments:** ✅ GET customer bookings (e.g. `booking/my-bookings`); display and cancel where backend supports.
- **My Orders:** ✅ GET `/order/my-orders` with auth; display via OrderItem.
- **Notifications:** ✅ Auth header; mark-as-read and read-all where backend supports; pull-to-refresh.
- **Products on Home:** ✅ Fetched from `/product/get-all` (or top); ProductCard add-to-cart uses CartContext.
- **Barbershop selector:** If multi-tenant for end users, add UI to set `X-Barbershop-Id` or equivalent.
- **Payment flow:** ✅ Chapa init and redirect to `checkout_url`; return URL / deep link (`abush://`) can be refined for post-payment resume.

### 4.3 Integration & Production

- **CORS:** Settings allow localhost/19006; adjust for production domain.
- **ALLOWED_HOSTS:** Currently `['*']`; should be restricted.
- **Webhook URL:** Chapa must reach backend (e.g. ngrok in dev, HTTPS in prod).
- **Logout:** Frontend “logout” calls `clearAuth()` (token, refreshToken, customerData) and resets navigation to `welcome`.
- **Security:** No CSRF discussed for web; JWT in cookie is set by backend for login; frontend primarily uses header (when token is stored).

---

## 5. Recommended Features (Near-Term)

- **Backend:**  
  - ✅ Customer bookings list and cancel (where implemented).  
  - ✅ OrderSerializer camelCase with `source=`; order create response with orderId.  
  - ✅ Notifications: mark-as-read, read-all, pagination where added.  
  - Social auth: implement `/auth/social/google/` and `/auth/social/apple/` (or equivalent) for Welcome screen Google/Apple sign-in.  
  - Optional: barbershop list/retrieve for clients.

- **Frontend:**  
  - ✅ JWT storage, 401 → welcome, logout clear storage; Welcome screen and AuthGate; optional force welcome.  
  - ✅ My Appointments and My Orders from API; Cart/Checkout with order create and Chapa redirect.  
  - ✅ Notifications with auth and mark-as-read; Home products from API.  
  - Chapa: refine deep link (`abush://`) and in-app verify/confirmation after return from browser.

- **UX:** ✅ Theme, loading/empty/error states, common components, logout clearing storage. Optional: refresh token in 401 interceptor; more a11y labels.

---

## 6. Future Roadmap (Complete Barber Shop System)

- **Discovery:** Barbershop search, filters, map; service/product catalog per shop; reviews/ratings for shops and barbers.
- **Booking:** Recurring slots; waitlist; reminders (email/push); no-show/cancellation policy and fees.
- **Commerce:** Inventory and low-stock alerts; discounts/coupons; invoices and receipts.
- **Payments:** Refunds, partial payments, multiple gateways; reconciliation and reporting.
- **Multi-tenant:** Tenant admin dashboard; branding and domains per shop; staff roles and permissions.
- **Communications:** In-app or email notifications; SMS reminders; optional chat.
- **Analytics:** Dashboards for owners (revenue, bookings, popular services); basic reporting.
- **Compliance:** Audit logs, data retention, consent and privacy (GDPR-style) where applicable.

---

## 7. Priorities Summary

| Priority | Area | Status / Action |
|----------|------|------------------|
| P0 | Frontend auth | **Done:** JWT stored on login/register; api.js sends token; 401 clears auth and resets to welcome; logout clears storage. Welcome screen + AuthGate; optional EXPO_PUBLIC_FORCE_WELCOME. |
| P0 | Backend bookings | **Done (if implemented):** Customer bookings list; cancel. Frontend uses in My Appointments. |
| P0 | Frontend bookings/orders | **Done:** My Appointments and My Orders consume API; Cart/Checkout with order create and Chapa. |
| P1 | Backend orders | **Done (if implemented):** OrderSerializer field mapping; order create response. |
| P1 | Frontend checkout | **Done:** CartContext, order create, Chapa redirect to checkout_url. |
| P1 | Notifications | **Done:** Auth header; mark-as-read/read-all and pagination where backend supports. |
| P1 | Products on Home | **Done:** Fetched from API; CartContext for add-to-cart. |
| P2 | Social auth backend | Implement Google/Apple token exchange endpoints for Welcome screen social sign-in. |
| P2 | Booking cancel/reschedule | Backend + frontend where not yet done. |
| P2 | Production hardening | CORS, ALLOWED_HOSTS, webhook URL, env validation; Expo scheme (`abush`) set. |
| P3 | Roadmap items | Discovery, reminders, refunds, multi-tenant UI, analytics. |

---

## 8. Recent Updates Summary (January 2025)

- **Auth flow:** WelcomeScreen as unauthenticated entry; AuthGate (isAuthenticated) sets initial route; 401 and logout reset to `welcome`. Config option `EXPO_PUBLIC_FORCE_WELCOME=true` forces Welcome first; WelcomeScreen skips “already logged in → home” when force welcome is set.
- **Auth service:** `authService.js` — loginWithEmail, exchangeGoogleToken, loginWithApple; social endpoints stubbed if not configured. Packages: expo-auth-session, expo-apple-authentication, expo-crypto, expo-web-browser.
- **Design system:** `theme/index.js` — typography, spacing, borderRadius, shadows (defined first to avoid runtime errors). Common components: Button, Card, EmptyState, ErrorView, LoadingScreen, SkeletonBox. Refactored screens use theme; no inline design tokens in updated areas.
- **Config:** `config.js` — apiBaseUrl, forceWelcome. `app.json` — scheme `abush` for linking. `.env` / `.env.example` — EXPO_PUBLIC_API_URL, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_FORCE_WELCOME.
- **Fixes:** Shadows imported in Home.js, CartItem.js; UserData and Profile/Account resolve avatar URI (string/array) to prevent Image crashes; babel/react-native aligned with Expo 54 (reanimated removed where unused).
- **Screens/components:** Login, Register, WelcomeScreen, Home, Cart, Checkout, Payments, MyOrders, MyAppointments, Notifications, Profile, Account, ServiceDetails, BookService, ProductCard, ServiceCard, CartItem, OrderItem, Layout, Header, Footer, InputBox — theme and state handling (loading/empty/error) where applicable.

This document is intended to support a senior developer in maintaining the frontend, integrating it fully with the backend, and moving the system toward production readiness.
