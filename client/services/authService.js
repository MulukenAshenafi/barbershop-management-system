/**
 * Auth actions: email, Google exchange, Apple.
 * No UI; returns { success, error }. Caller handles navigation and alerts.
 * Google: use AuthSession hook in screen, then call exchangeGoogleToken(id_token).
 */
import axios from 'axios';
import * as AppleAuthentication from 'expo-apple-authentication';
import config from '../config';
import { setAuth } from './auth';

const API = config.apiBaseUrl;

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id ?? user._id,
    _id: user._id ?? user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? '',
    phone: user.phone ?? '',
    profilePic: user.profilePic,
    location: user.location ?? '',
    preferences: user.preferences ?? '',
    specialization: user.specialization ?? '',
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

/**
 * Email login. Uses existing backend POST /customers/login.
 */
export async function loginWithEmail(username, password) {
  if (!username?.trim() || !password) {
    return { success: false, error: 'Please enter username and password' };
  }
  try {
    const { data } = await axios.post(`${API}/customers/login`, {
      username: username.trim(),
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

/**
 * Exchange Google id_token with backend. Call after AuthSession returns id_token.
 * Backend: POST /auth/social/google/ { id_token }.
 */
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

/**
 * Apple Sign-In: get identityToken, exchange with backend.
 * Backend: POST /auth/social/apple/ { id_token, email?, fullName? }.
 */
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
