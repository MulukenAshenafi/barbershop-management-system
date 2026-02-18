// config.js – API base URL for the Django backend
// Production default; override with EXPO_PUBLIC_API_URL in .env for dev/staging (e.g. http://YOUR_IP:8000/api).
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://barbershop-management-system-xxv5.onrender.com/api";

const getApiBaseUrl = () => {
  const raw = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).trim()
    : "";
  const envUrl = raw && !/^exp:\/\//i.test(raw) && /^https?:\/\//i.test(raw) ? raw : "";
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  // No env set: use production. For local dev, set EXPO_PUBLIC_API_URL in .env.
  if (Platform.OS === "web") {
    return PRODUCTION_API_URL;
  }
  if (Platform.OS === "android") {
    return PRODUCTION_API_URL;
  }
  return PRODUCTION_API_URL;
};

const getForceWelcome = () => {
  const raw = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_FORCE_WELCOME
    ? String(process.env.EXPO_PUBLIC_FORCE_WELCOME).trim().toLowerCase()
    : "";
  return raw === "true" || raw === "1";
};

/** Expo auth proxy URL for Google OAuth. Web client only accepts https redirects; use this so we don't need barberbook:// */
const getGoogleRedirectUri = () => {
  const env = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (env && /^https:\/\//.test(env)) return env.replace(/\/$/, "");
  return "https://auth.expo.io/@mullervic/barberbook";
};

const config = {
  apiBaseUrl: getApiBaseUrl(),
  /** When true, app always starts at Welcome screen (ignores stored token). Useful for testing. */
  forceWelcome: getForceWelcome(),
  /** Redirect URI for Google OAuth (must be https; add same value in Google Cloud Web client). */
  googleRedirectUri: getGoogleRedirectUri(),
};
export default config;
