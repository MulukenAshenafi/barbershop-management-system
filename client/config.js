// config.js – API base URL for the Django backend
// Set EXPO_PUBLIC_API_URL in .env (e.g. http://YOUR_IP:8000/api) when using a physical device.
import { Platform } from "react-native";

const getApiBaseUrl = () => {
  const raw = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).trim()
    : "";
  // Reject exp:// and any non-HTTP(S) URL so we never pass them to axios
  const envUrl = raw && !/^exp:\/\//i.test(raw) && /^https?:\/\//i.test(raw) ? raw : "";
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  // Android emulator: 10.0.2.2 is the host machine
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000/api";
  }
  // Web / iOS simulator: backend on same machine
  return "http://localhost:8000/api";
};

const getForceWelcome = () => {
  const raw = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_FORCE_WELCOME
    ? String(process.env.EXPO_PUBLIC_FORCE_WELCOME).trim().toLowerCase()
    : "";
  return raw === "true" || raw === "1";
};

const config = {
  apiBaseUrl: getApiBaseUrl(),
  /** When true, app always starts at Welcome screen (ignores stored token). Useful for testing. */
  forceWelcome: getForceWelcome(),
};
export default config;
