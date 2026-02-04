/**
 * Auth: Firebase (email/password, phone OTP), Google, Apple.
 * Firebase: sign up, sign in, phone OTP, logout. ID token sent via api.js; no token stored.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPhoneNumber,
  updateProfile,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
} from 'firebase/auth';
import config from '../config';
import { setAuth, clearAuth, FIREBASE_AUTH_FLAG, EMAIL_LINK_EMAIL } from './auth';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';

const API = config.apiBaseUrl;

/** URL that opens the app when user clicks the email sign-in link. Its domain must be in Firebase Console > Authentication > Settings > Authorized domains. */
function getEmailSignInLinkUrl() {
  const envUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_EMAIL_LINK_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim();
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin + '/email-signin';
  }
  // Native: custom schemes (barberbook://) have no domain, so Firebase rejects them. Use HTTPS with the project's auth domain (already authorized).
  const authDomain = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (authDomain && typeof authDomain === 'string' && authDomain.trim()) {
    const base = authDomain.trim().replace(/^https?:\/\//, '');
    return `https://${base}/email-signin`;
  }
  return 'https://bsbs-local.firebaseapp.com/email-signin';
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id ?? user._id,
    _id: user._id ?? user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? '',
    phone: user.phone ?? user.phoneNumber ?? '',
    phoneNumber: user.phoneNumber ?? user.phone ?? '',
    profilePic: user.profilePic,
    location: user.location ?? '',
    preferences: user.preferences ?? '',
    specialization: user.specialization ?? '',
  };
}

async function syncUserWithBackend(idToken) {
  const { data } = await axios.post(`${API}/auth/firebase-login`, {
    id_token: idToken,
  });
  if (!data.success || !data.user) {
    throw new Error(data.message || 'Backend sync failed');
  }
  return normalizeUser(data.user);
}

function userToCustomerData(user) {
  const u = normalizeUser(user);
  const pic = u.profilePic ?? user?.profile_pic;
  const profilePicUrl =
    (Array.isArray(pic) && pic[0]?.url) ? pic[0].url
    : (pic && typeof pic === 'object' && pic.url) ? pic.url
    : (typeof pic === 'string' ? pic : null) || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
  return {
    customerId: u.id ?? u._id,
    customerName: u.name ?? '',
    customerEmail: u.email ?? '',
    customerRole: u.role ?? '',
    customerPhone: u.phone ?? u.phoneNumber ?? '',
    customerProfilePic: profilePicUrl,
    customerLocation: u.location ?? '',
    customerPreferences: u.preferences ?? '',
    customerSpecialization: u.specialization ?? '',
  };
}

function applyAuthResponse(data) {
  const token = data.token ?? data.access;
  const refreshToken = data.refreshToken ?? data.refresh ?? null;
  const user = data.user ?? data;
  return setAuth({
    token: token || null,
    refreshToken,
    user: normalizeUser(user),
  });
}

// --- Firebase Email/Password ---

export async function signUpWithEmail(email, password, displayName = null) {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase is not configured' };
  }
  if (!email?.trim() || !password) {
    return { success: false, error: 'Please enter email and password' };
  }
  try {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    const idToken = await cred.user.getIdToken();
    const user = await syncUserWithBackend(idToken);
    await setAuth({
      token: null,
      refreshToken: null,
      user: userToCustomerData(user),
    });
    await AsyncStorage.setItem(FIREBASE_AUTH_FLAG, '1');
    return { success: true };
  } catch (err) {
    const msg = err.code === 'auth/email-already-in-use'
      ? 'This email is already registered'
      : err.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : err.message || 'Sign up failed';
    return { success: false, error: msg };
  }
}

export async function loginWithEmail(email, password) {
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const idToken = await cred.user.getIdToken();
      const user = await syncUserWithBackend(idToken);
    await setAuth({
      token: null,
      refreshToken: null,
      user: userToCustomerData(user),
    });
    await AsyncStorage.setItem(FIREBASE_AUTH_FLAG, '1');
    return { success: true };
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : err.message || 'Login failed';
      return { success: false, error: msg };
    }
  }
  // Legacy: backend email/password
  try {
    const { data } = await axios.post(`${API}/customers/login`, {
      email: email.trim().toLowerCase(),
      password,
    });
    if (data.success && (data.token || data.user)) {
      await applyAuthResponse(data);
      return { success: true };
    }
    return { success: false, error: data.message || 'Login failed' };
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.errors?.non_field_errors?.[0] ||
      err.message ||
      'Login failed';
    return { success: false, error: msg };
  }
}

// --- Firebase Phone OTP ---
// On web: caller must create RecaptchaVerifier (firebase/auth) and pass as applicationVerifier.
// E.g. new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' }, auth).

export async function sendPhoneOtp(phoneNumber, applicationVerifier) {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase is not configured' };
  }
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, error: 'Firebase Auth not available' };
  if (!applicationVerifier) {
    return { success: false, error: 'Phone sign-in requires a verifier (e.g. Recaptcha on web). Use email on app.' };
  }
  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
    return { success: true, confirmation };
  } catch (err) {
    const msg = err.message || 'Failed to send verification code';
    return { success: false, error: msg };
  }
}

export async function verifyPhoneOtp(confirmation, code) {
  if (!confirmation || !code?.trim()) {
    return { success: false, error: 'Invalid verification' };
  }
  try {
    const result = await confirmation.confirm(code.trim());
    const idToken = await result.user.getIdToken();
    const user = await syncUserWithBackend(idToken);
    await setAuth({
      token: null,
      refreshToken: null,
      user: userToCustomerData(user),
    });
    await AsyncStorage.setItem(FIREBASE_AUTH_FLAG, '1');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Invalid code' };
  }
}

// --- Email link (verification-style sign-in) ---

export async function sendEmailSignInLink(email) {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase is not configured' };
  }
  if (!email?.trim()) {
    return { success: false, error: 'Please enter your email' };
  }
  try {
    const auth = getFirebaseAuth();
    const actionCodeSettings = {
      url: getEmailSignInLinkUrl(),
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
    await AsyncStorage.setItem(EMAIL_LINK_EMAIL, email.trim().toLowerCase());
    return { success: true };
  } catch (err) {
    const code = err.code || '';
    let msg = 'Failed to send sign-in link';
    if (code === 'auth/invalid-email') msg = 'Invalid email address';
    else if (code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    else if (code === 'auth/quota-exceeded') {
      msg = 'Daily limit for sign-in links reached. Use "Continue with password" below, or try again tomorrow.';
    } else if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
      msg = 'Email link sign-in is not enabled. In Firebase Console go to Authentication > Sign-in method, enable Email/Password, then enable "Email link" and save.';
    } else if (code === 'auth/unauthorized-continue-uri') {
      const url = getEmailSignInLinkUrl();
      msg = `Redirect URL not allowlisted. In Firebase Console go to Authentication > Settings > Authorized domains and add the domain of: ${url}`;
    } else if (err.message) msg = err.message;
    return { success: false, error: msg };
  }
}

/**
 * Resolve the URL we use for Firebase signInWithEmailLink.
 * When the app is opened via barberbook://email-signin?apiKey=...&oobCode=..., Firebase expects
 * the full HTTPS action URL. Reconstruct it from the same base we used when sending the link.
 */
export function resolveEmailLinkUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
  if (trimmed.startsWith('barberbook://email-signin') || trimmed.startsWith('barberbook://')) {
    try {
      const parsed = new URL(trimmed);
      const linkParam = parsed.searchParams.get('link');
      if (linkParam) return decodeURIComponent(linkParam);
      const base = getEmailSignInLinkUrl();
      const baseUrl = base.includes('?') ? base.split('?')[0] : base;
      return baseUrl + (parsed.search || '');
    } catch (_) {
      return trimmed;
    }
  }
  return trimmed;
}

export function isEmailSignInLink(url) {
  if (!url || !isFirebaseConfigured()) return false;
  const auth = getFirebaseAuth();
  const resolved = resolveEmailLinkUrl(url);
  return isSignInWithEmailLink(auth, resolved);
}

export async function completeEmailLinkSignIn(email, linkUrl) {
  if (!email?.trim() || !linkUrl) {
    return { success: false, error: 'Email and link are required' };
  }
  const resolvedUrl = resolveEmailLinkUrl(linkUrl);
  try {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailLink(auth, email.trim().toLowerCase(), resolvedUrl);
    await AsyncStorage.removeItem(EMAIL_LINK_EMAIL);
    const idToken = await cred.user.getIdToken();
    const user = await syncUserWithBackend(idToken);
    await setAuth({
      token: null,
      refreshToken: null,
      user: userToCustomerData(user),
    });
    await AsyncStorage.setItem(FIREBASE_AUTH_FLAG, '1');
    return { success: true };
  } catch (err) {
    const msg = err.message || 'Invalid or expired link. Request a new sign-in link.';
    return { success: false, error: msg };
  }
}

export async function getStoredEmailLinkEmail() {
  return AsyncStorage.getItem(EMAIL_LINK_EMAIL);
}

// --- Logout ---

export async function logout() {
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) await signOut(auth);
    } catch (_) {}
    await AsyncStorage.removeItem(FIREBASE_AUTH_FLAG);
  }
  await clearAuth();
}

// --- Google ---

export async function exchangeGoogleToken(idToken) {
  if (!idToken) return { success: false, error: 'No Google token' };
  try {
    const { data } = await axios.post(`${API}/auth/social/google/`, {
      id_token: idToken,
    });
    if (data.token || data.user) {
      await applyAuthResponse(data);
      return { success: true };
    }
    return { success: false, error: data.message || 'Google sign-in failed' };
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 501) {
      return {
        success: false,
        error: 'Google sign-in is not set up yet. Use Email to sign in.',
      };
    }
    const msg = err.response?.data?.message || err.message || 'Google sign-in failed';
    return { success: false, error: msg };
  }
}

// --- Apple ---

export async function loginWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    const { identityToken, email, fullName } = credential;
    if (!identityToken) {
      return { success: false, error: 'Apple sign-in was cancelled' };
    }

    const { data } = await axios.post(`${API}/auth/social/apple/`, {
      id_token: identityToken,
      email: email || undefined,
      full_name: fullName
        ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
        : undefined,
    });

    if (data.token || data.user) {
      await applyAuthResponse(data);
      return { success: true };
    }
    return { success: false, error: data.message || 'Apple sign-in failed' };
  } catch (err) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Apple sign-in was cancelled' };
    }
    if (err.response?.status === 404 || err.response?.status === 501) {
      return {
        success: false,
        error: 'Apple sign-in is not set up yet. Use Email to sign in.',
      };
    }
    const msg = err.response?.data?.message || err.message || 'Apple sign-in failed';
    return { success: false, error: msg };
  }
}

export async function getFirebaseIdToken(forceRefresh = false) {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export { isFirebaseConfigured };
