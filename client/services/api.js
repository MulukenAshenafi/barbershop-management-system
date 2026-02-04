/**
 * Shared API client for all backend requests. Use this instead of raw axios so that:
 * - Base URL comes from config (production or EXPO_PUBLIC_API_URL).
 * - Authorization: Bearer <JWT> is attached from stored token; 401 triggers refresh or logout.
 * - X-Barbershop-Id is set when a barbershop is selected.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

let unauthorizedHandler = null;
let subscriptionExpiredHandler = null;
let activeBarbershopIdForApi = null;

/** Optional message to show before redirect (e.g. 'Session expired'). Handler receives (message). */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function setSubscriptionExpiredHandler(handler) {
  subscriptionExpiredHandler = handler;
}

/** Set tenant context for API requests. Call from BarbershopContext when activeBarbershop changes. */
export function setActiveBarbershopIdForApi(id) {
  activeBarbershopIdForApi = id == null ? null : String(id);
}

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 60000, // 60s so Render free-tier cold start (~30–60s) can complete
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (req) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) req.headers.Authorization = `Bearer ${token}`;
      if (activeBarbershopIdForApi) {
        req.headers['X-Barbershop-Id'] = activeBarbershopIdForApi;
      }
    } catch (e) {
      // ignore
    }
    return req;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const hadAuthHeader = !!original.headers?.Authorization;
      // Try refresh token once
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (hadAuthHeader && refreshToken) {
        try {
          const { data } = await axios.post(`${config.apiBaseUrl}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          if (data.access) {
            await AsyncStorage.setItem('token', data.access);
            original.headers.Authorization = `Bearer ${data.access}`;
            return api(original);
          }
        } catch (_) {
          // refresh failed, clear and notify
        }
      }
      if (hadAuthHeader) {
        try {
          await AsyncStorage.multiRemove([
            'token',
            'refreshToken',
            'customerData',
            'active_barbershop_id',
          ]);
        } catch (e) {
          // ignore
        }
      }
      if (typeof unauthorizedHandler === 'function') {
        unauthorizedHandler(hadAuthHeader ? 'Session expired' : null);
      }
    }
    if (err.response?.status === 403 && err.response?.data?.detail === 'Subscription expired') {
      if (typeof subscriptionExpiredHandler === 'function') {
        subscriptionExpiredHandler();
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Centralized API error message for user-facing toasts/alerts.
 * Prefers backend message/validation errors, falls back to status or generic message.
 * For network errors, returns a hint to run the backend and check EXPO_PUBLIC_API_URL.
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong.') {
  if (!err) return fallback;
  const isNetworkError =
    err.message === 'Network Error' ||
    err.code === 'ERR_NETWORK' ||
    (err.response == null && err.request != null);
  if (isNetworkError) {
    return (
      "Can't reach the server. Make sure the backend is running (e.g. python manage.py runserver 0.0.0.0:8000) " +
      "and your device is on the same Wi‑Fi. If using a physical device, set EXPO_PUBLIC_API_URL in .env to your computer's IP (e.g. http://YOUR_IP:8000/api)."
    );
  }
  const data = err.response?.data;
  const msg = data?.message ?? data?.detail ?? data?.error;
  if (msg && typeof msg === 'string') return msg;
  if (data?.errors && typeof data.errors === 'object') {
    const parts = Object.entries(data.errors).map(([k, v]) =>
      `${k}: ${Array.isArray(v) ? v[0] : v}`
    );
    if (parts.length) return parts.join('\n');
  }
  if (err.response?.status === 401) return 'Session expired.';
  if (err.response?.status === 403) return data?.detail ?? 'Not allowed.';
  if (err.response?.status === 404) return 'Not found.';
  if (err.response?.status === 409) return data?.detail ?? data?.message ?? 'Conflict.';
  return err.message || fallback;
}

export default api;
