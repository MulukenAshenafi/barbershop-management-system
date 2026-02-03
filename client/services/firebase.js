/**
 * Firebase client: Auth only (no Firestore/Realtime DB).
 * Initialized from env: EXPO_PUBLIC_FIREBASE_*.
 * On React Native, uses AsyncStorage so auth state persists between sessions.
 */
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getEnv = (key, def = '') => {
  const raw = typeof process !== 'undefined' && process.env?.[key];
  return (raw && typeof raw === 'string' ? raw.trim() : '') || def;
};

const firebaseConfig = {
  apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

let app = null;
let auth = null;

function getFirebaseApp() {
  if (app) return app;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }
  app = initializeApp(firebaseConfig);
  return app;
}

function getFirebaseAuth() {
  if (auth) return auth;
  const a = getFirebaseApp();
  if (!a) return null;
  // React Native: persist auth with AsyncStorage. Web: use default getAuth.
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  if (isNative) {
    try {
      auth = initializeAuth(a, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch (err) {
      // Already initialized (e.g. hot reload) – use getAuth
      if (err.code !== 'auth/already-initialized') throw err;
      auth = getAuth(a);
    }
  } else {
    auth = getAuth(a);
  }
  return auth;
}

export function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export { getFirebaseApp, getFirebaseAuth };
