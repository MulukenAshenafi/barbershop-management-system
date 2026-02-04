# Django JWT Auth – React Native / Expo Integration

This app can use **Django-native auth** (JWT) instead of Firebase. The backend exposes these endpoints under `/api/auth/`.

## Endpoints

| Action | Method | Path | Body (JSON) |
|--------|--------|------|-------------|
| Register | POST | `/api/auth/register/` | `first_name`, `last_name`, `email`, `password` |
| Login | POST | `/api/auth/login` | `email`, `password` |
| Verify email | GET or POST | `/api/auth/verify-email/<token>/` | — |
| Password reset request | POST | `/api/auth/password-reset/` | `email` |
| Password reset confirm | POST | `/api/auth/password-reset/confirm/` | `token`, `new_password` |
| Change email request | POST | `/api/auth/change-email/` | `new_email` (auth: Bearer) |
| Change email confirm | GET/POST | `/api/auth/change-email/confirm/?token=<token>` | or body `token` |
| Guest login | POST | `/api/auth/guest-login/` | optional: `name` |
| Refresh token | POST | `/api/auth/token/refresh/` | `refresh` (body) |

## Token usage

- **Access token**: Send in every API request: `Authorization: Bearer <access_token>`.
- **Refresh token**: Store securely (e.g. AsyncStorage). When the backend returns 401 or the access token is about to expire, call `POST /api/auth/token/refresh/` with body `{ "refresh": "<refresh_token>" }` to get a new `access` token.

## Client flow (Django-only mode)

1. **Do not set** `FIREBASE_AUTH_FLAG` in AsyncStorage when using Django auth. Your existing `api.js` already attaches `Authorization: Bearer` from `AsyncStorage.getItem('token')` when Firebase is not used.
2. **After login/register/verify/guest-login**: Save `token` (access) and `refresh` (refresh) and `user` using your existing `setAuth({ token, refreshToken: refresh, user })` from `auth.js`.
3. **On 401**: Clear auth and redirect to login. Optionally before that, try one refresh:  
   `POST /api/auth/token/refresh/` with `{ "refresh": "<stored_refresh>" }`; on success, save the new `access` as `token` and retry the request.
4. **Registration**: Call `POST /api/auth/register/` with `first_name`, `last_name`, `email`, `password`. Show “Check your email to verify”. When the user taps the link, open `GET /api/auth/verify-email/<token>/` (or your app deep link that calls this). The response can include `token` and `refresh` and `user` — then call `setAuth` and mark the user as logged in.
5. **Password reset**: Request with `POST /api/auth/password-reset/` and `email`. User receives email; link should open your app or a page that calls `POST /api/auth/password-reset/confirm/` with `token` and `new_password`.

## Example: Login and store tokens

```javascript
import api from '../services/api';
import { setAuth, clearAuth } from '../services/auth';

async function loginWithDjango(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.success && data.token) {
    await setAuth({
      token: data.token,
      refreshToken: data.refresh,
      user: data.user,
    });
    return data.user;
  }
  throw new Error(data.message || 'Login failed');
}
```

## Example: Refresh token

```javascript
async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  const { data } = await api.post('/auth/token/refresh/', { refresh: refreshToken });
  if (data.access) {
    await AsyncStorage.setItem('token', data.access);
    return data.access;
  }
  return null;
}
```

## Example: Register (first name, last name, email, password)

```javascript
async function registerDjango(firstName, lastName, email, password) {
  const { data } = await api.post('/auth/register/', {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
  });
  if (data.success) {
    // Show: "Check your email to verify your account."
    return data.message;
  }
  throw new Error(data.message || 'Registration failed');
}
```

## Backend env (emails)

Set in backend `.env` (or Render env):

- `EMAIL_VERIFICATION_BASE_URL`: Base URL for links in emails (e.g. `barberbook://` for app deep link or `https://yourapp.com`).
- SMTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`.

If `EMAIL_HOST` is not set, the backend uses the console backend (emails printed to stdout).

## Security notes

- Never log or send refresh tokens to third parties.
- Use HTTPS in production; store tokens in a secure storage (e.g. AsyncStorage; for higher security consider encrypted storage).
- Unverified accounts (Django register) cannot log in until they verify email; login returns a clear error message.
