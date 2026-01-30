# QA Report – Abush Barber Shop (React Native / Expo)

**Date:** January 30, 2026  
**Scope:** React Native (Expo) client + Django backend (referenced where relevant)  
**Platforms tested:** Web (Expo Web), code review for mobile flows

---

## 1. Test Execution Summary

| Item | Result |
|------|--------|
| **App runs successfully?** | **Yes** (after fixes below and installing web deps: `npx expo install react-dom react-native-web`) |
| **Platforms tested** | Web (Expo Web). iOS/Android not run in this audit. |
| **Blocking issues found** | **6** (all addressed with code fixes in this audit) |

**Setup notes:**
- **Web:** Expo Web required `react-dom` and `react-native-web`; these were not in `package.json`. Installed via `npx expo install react-dom react-native-web`.
- **Backend:** Not started during this audit. Client assumes `EXPO_PUBLIC_API_URL` or `http://localhost:8000/api` (web) / `http://10.0.2.2:8000/api` (Android).
- **Warnings:** Expo reported several packages with version mismatches (e.g. `expo-apple-authentication`, `expo-auth-session`). Recommend `npx expo install --fix` for compatibility.
- **Security:** `npm audit` reported 5 high severity vulnerabilities; address with `npm audit` / `npm audit fix` (or `--force` only if acceptable).

---

## 2. Critical Bugs (Must Fix)

All of the following were **identified and fixed** in the codebase during this audit.

### BUG-1: ReviewsScreen – `themeColors` undefined & `toast` undefined

- **Screen:** `client/screens/Shop/ReviewsScreen.js`
- **Steps:** Navigate to a shop → “See all reviews” → Reviews screen.
- **Expected:** Screen renders; toasts show on submit/error.
- **Actual:** Runtime error: `themeColors is not defined` (container background), and `toast is not defined` when submitting a review.
- **Root cause:** Container used `themeColors.background` but `themeColors` was never defined; `toast.show` was used without calling `useToast()`.
- **Fix applied:**
  - Added `const toast = useToast();` and `const { colors: themeColors } = useTheme();`.
  - Replaced `themeColors.background` usage with theme-based `themeColors`.
  - For static styles (sort chips), use `themeColorsStatic` from `import { colors as themeColorsStatic } from '../../theme'`.

---

### BUG-2: Payments.js – `Alert` not imported

- **Screen:** `client/screens/Payments.js`
- **Steps:** Book a service → choose “Online” → on Payments screen, trigger error path or “Payment link” message.
- **Expected:** `Alert.alert(...)` shows a dialog.
- **Actual:** ReferenceError: `Alert is not defined`.
- **Root cause:** `Alert` was used but not imported from `react-native`.
- **Fix applied:** Added `Alert` to the React Native import list in `Payments.js`.

---

### BUG-3: BookService – `colors` undefined in StyleSheet

- **Screen:** `client/screens/BookService.js`
- **Steps:** Navigate to BookService (e.g. from ServiceDetails).
- **Expected:** Screen renders with correct background and button colors.
- **Actual:** ReferenceError when module loads: `colors is not defined` inside `StyleSheet.create({...})`.
- **Root cause:** Static styles referenced `colors.background`, `colors.accent`, `colors.white` but `colors` was only available from `useTheme()` inside the component, not at module scope.
- **Fix applied:** Import default theme colors: `import { ..., colors as themeColors } from '../theme'` and use `themeColors` in `StyleSheet.create`. Dynamic UI (e.g. Calendar, ActivityIndicator) continues to use `colors` from `useTheme()`.

---

### BUG-4: BookService – Missing service params from Shop “Book Now”

- **Screen:** `client/screens/ShopPublicProfileScreen.js` → `BookService`
- **Steps:** Explore Shops → open a shop → tap “Book Now”.
- **Expected:** BookService opens with a selected service (or clear fallback).
- **Actual:** BookService received only `barbershopId`; `serviceId`, `serviceName`, `servicePrice` were undefined, leading to broken or crashing behavior.
- **Root cause:** `ShopPublicProfileScreen` navigated with `{ barbershopId: shop.id }` only; BookService expects at least `serviceId` and `serviceName`.
- **Fix applied:**
  - **ShopPublicProfileScreen:** When shop has services, pass first service: `serviceId`, `serviceName`, `servicePrice`, `serviceImage`, and `barbershopId`. When no services, still pass `barbershopId`.
  - **BookService:** Guard when `serviceId` or `serviceName` is missing: show “Please select a service first” and a “Go back” button instead of proceeding.

---

### BUG-5: MyAppointments – `colors` not in scope in AppointmentCard & hooks order

- **Screen:** `client/screens/Account/MyAppointments.js`
- **Steps:** Log in → My Appointments (with or without bookings).
- **Expected:** Cards render with correct text/border colors (e.g. accent, error).
- **Actual:** ReferenceError in `AppointmentCard`: `colors` is not defined (used in inline styles).
- **Root cause:** `AppointmentCard` used `colors` but it was only defined in the parent; child does not have access. Also `useTheme()` was called after an early `return`, violating Rules of Hooks.
- **Fix applied:**
  - Call `useTheme()` at the top of `MyAppointments` (before any return).
  - Pass `colors` into `AppointmentCard` as a prop and use it in the card’s inline styles.

---

### BUG-6: Profile.js – Syntax error (unclosed JSX)

- **Screen:** `client/screens/Account/Profile.js`
- **Steps:** Open app → navigate to Profile (e.g. from Account).
- **Expected:** Profile screen loads.
- **Actual:** Bundler SyntaxError: “Unexpected token, expected }” at `styles.scroll` – parser thought JSX was still open.
- **Root cause:** `KeyboardAvoidingView` was opened but never closed; `</ScrollView>` was followed by `);` and `};` without `</KeyboardAvoidingView>`.
- **Fix applied:** Closed the JSX with `</KeyboardAvoidingView>` before the return’s closing `);`.

---

## 3. Medium / Minor Issues

### UX / Flow

- **Login → Home stack:** After login, the app uses `navigation.reset({ name: 'home' })` on the *unauthenticated* stack. User sees Home but is still in the unauthenticated stack (no BarbershopProvider, etc.). Full auth stack (with enrollment gate, my-shops) only appears after app restart. **Recommendation:** After login, trigger an auth-state refresh (e.g. context/callback or key change) so the tree re-renders with the authenticated stack, or force a full remount.
- **Empty “Book Now” from Shop:** If a shop has no services, “Book Now” still navigates to BookService with only `barbershopId`; BookService now shows “Please select a service first.” Consider disabling “Book Now” or showing “No services available” when `services.length === 0`.
- **MyAppointments “Book Now”:** Empty state action navigates to `BookService` with no params, so BookService correctly shows “Please select a service first.” Consider navigating to ServiceList or Home instead for a clearer path.

### Inconsistencies

- **Toast vs Alert:** Mix of `toast.show()` and `Alert.alert()` across the app (e.g. BookService success uses Alert, many others use toast). Prefer toast for non-blocking feedback and Alert for confirmations or critical errors; document and apply consistently.
- **Register:** Uses raw `axios` and `config.apiBaseUrl` instead of the shared `api` client (no auth header needed for signup, but consistency and 401 handling differ).
- **Theme in static styles:** Some screens (e.g. ReviewsScreen sort chips) use static theme import in `StyleSheet.create`, so they don’t switch with dark mode. Prefer inline styles from `useTheme()` for theme-dependent values where possible.

### Error / Edge

- **Checkout COD:** No client-side double-submit guard (e.g. disabled button or flag) while `handleCOD` is in flight; user could double-tap and create two orders. Online flow uses idempotency key; COD does not.
- **Network/API errors:** Many screens only show a generic message or `e.response?.data?.message`. Consider centralizing API error formatting and optional retry.
- **Session expiry:** 401 triggers global handler and clears storage; user is sent to Welcome. No explicit “Session expired” toast before redirect.

### Visual / A11y

- **Toast:** Fixed position and hardcoded colors (`#1a1a2e`, `#28a745`, `#dc3545`) – not theme-aware; may contrast poorly in dark mode.
- **ProductDetails:** Uses `alert()` for “max quantity” and “items added” – replace with toast for consistency and better a11y.

---

## 4. Missing Tests / Risk Areas

### Client (React Native)

- **Unit / integration tests:** No Jest or React Native Testing Library tests were found in the client (no `*.test.js` / `*.spec.js`).
- **Risks:**
  - Regressions when changing auth, cart, or booking flows.
  - Navigation and route params (e.g. BookService, Payments) are easy to break.
  - Theme and context (Cart, Barbershop, Theme) used everywhere; untested hooks can cause runtime errors (as seen with `colors` / `toast`).

**Recommendations:**

1. **Add testing stack:** Jest + React Native Testing Library (+ optional Detox for E2E).
2. **Priority test areas:**
   - **Auth:** Login/Register success and error paths; token storage and redirect.
   - **Cart:** addItem, removeItem, updateQuantity, clearCart; id handling (`_id` vs `product`).
   - **Booking:** BookService with/without params; guard when service is missing.
   - **Reviews:** Submit, edit, duplicate detection (400 message).
   - **Contexts:** CartProvider, ThemeProvider, BarbershopProvider (consumer behavior).
3. **Sample cases (conceptual):**
   - Login: valid credentials → success callback; invalid → error message.
   - Cart: add same product twice → quantity 2; removeItem → item gone.
   - BookService: no serviceId → show “Please select a service first” and back button.

### Backend

- **Existing:** Django tests in `accounts`, `bookings`, `services` (models and some API).
- **Gaps:** No pytest/coverage run was executed; barbershops, payments, notifications, and review APIs are high-value targets for automated tests (idempotency, 409 for double booking, 400 for duplicate review).

---

## 5. Improvement Recommendations

### UX

- After login, show authenticated stack immediately (auth state refresh or remount).
- Use toast for success/error feedback; reserve Alert for confirmations and critical errors.
- Make “Book Now” from shop conditional on having at least one service; or show “No services” and avoid navigating to BookService with no service.

### Error handling

- Centralize API error parsing (message, validation errors) and optional retry.
- On 401, show a short “Session expired” toast before redirecting to Welcome.
- Add a simple double-submit guard for Checkout COD (e.g. disable button while `loading`).

### Architecture / consistency

- Use shared `api` client everywhere (including Register if backend allows).
- Document when to use toast vs Alert and apply consistently.
- Consider a small “param guard” helper for screens that require route params (e.g. BookService, Payments) to avoid missing-param bugs.

### Performance

- Cart: `subtotal` / `total` recompute on every render; already derived from `items` – acceptable unless list is huge; memoization is optional.
- List screens (reviews, appointments, orders): use `FlatList` where applicable for long lists (ReviewsScreen already uses FlatList).
- Images: `OptimizedImage` is used in some places; ensure all remote images use it where beneficial.

### Theming

- Make Toast use theme colors (e.g. from ThemeContext or theme tokens) so it respects light/dark mode.
- Prefer inline theme-based styles over static theme in StyleSheet for theme-dependent UI (e.g. sort chips on ReviewsScreen).

---

## 6. Production Readiness Verdict

| Criterion | Status | Notes |
|-----------|--------|-------|
| **App boots without runtime errors** | ✅ | After fixes and web deps. |
| **Critical user flows (auth, book, cart, checkout, reviews)** | ⚠️ | Implemented; some edge cases and UX gaps (see above). |
| **Error handling** | ⚠️ | Present but inconsistent; no central strategy. |
| **Tests** | ❌ | No client tests; backend has some Django tests. |
| **Security** | ⚠️ | npm audit issues; token/401 handling in place. |
| **Accessibility** | ⚠️ | No a11y audit; mix of Alert and toast; touch targets generally OK via theme. |

**Verdict:** **Not yet production-ready** for a high-traffic or compliance-sensitive deployment. **Suitable for portfolio/demo** provided:

1. All critical bugs in this report are fixed (done in this audit).
2. Web dependencies are installed and optional Expo package versions aligned.
3. You run through the main flows once on web (and ideally on a device) with the backend running.
4. You add at least a small set of client-side tests (auth + cart + booking guard) and run backend test suite (e.g. `pytest`).

**To reach production-ready:**

- Add client test suite (Jest + RTL) for auth, cart, booking, and reviews.
- Harden error handling and session expiry UX.
- Unify toast vs Alert and theme-aware Toast.
- Address npm audit and Expo compatibility warnings.
- Run E2E or manual QA on iOS/Android and with real backend.
- Consider feature flags or staged rollout for payments and bookings.

---

## Summary of Code Fixes Applied in This Audit

| File | Change |
|------|--------|
| `client/screens/Shop/ReviewsScreen.js` | Added `useToast()` and `useTheme()`; fixed `themeColors` usage; static styles use `themeColorsStatic`. |
| `client/screens/Payments.js` | Added `Alert` to React Native imports. |
| `client/screens/BookService.js` | Import `colors as themeColors` from theme for StyleSheet; guard when `serviceId`/`serviceName` missing with message and back button. |
| `client/screens/ShopPublicProfileScreen.js` | “Book Now” passes first service when available (`serviceId`, `serviceName`, `servicePrice`, `serviceImage`, `barbershopId`). |
| `client/screens/Account/MyAppointments.js` | `useTheme()` at top; pass `colors` into `AppointmentCard`. |
| `client/screens/Account/Profile.js` | Closed `KeyboardAvoidingView` with `</KeyboardAvoidingView>`. |

**Environment:** `npx expo install react-dom react-native-web` was run to enable Expo Web.
