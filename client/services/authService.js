/**
 * Auth: Django JWT only (email/password, register, guest, password reset).
 * Google/Apple call backend /api/auth/social/google/ or /apple/ and return JWT.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { setAuth, clearAuth } from './auth';
import api from './api';

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
    isGuest: user.isGuest ?? false,
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

// --- Django Email/Password Login ---

export async function loginWithEmail(email, password) {
  if (!email?.trim() || !password) {
    return { success: false, error: 'Please enter email and password' };
  }
  try {
    const { data } = await api.post('auth/login/', {
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

// --- Django Register (email verification required) ---

export async function registerWithEmail(firstName, lastName, email, password) {
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    return { success: false, error: 'Please fill in all fields' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  try {
    const { data } = await api.post('auth/register/', {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    if (data.success) {
      return { success: true, message: data.message || 'Check your email to verify your account.' };
    }
    return { success: false, error: data.message || 'Registration failed' };
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      (err.response?.data?.errors && typeof err.response.data.errors === 'object'
        ? Object.values(err.response.data.errors).flat()[0]
        : null) ||
      err.message ||
      'Registration failed';
    return { success: false, error: msg };
  }
}

// --- Django Guest Login ---

export async function guestLogin(name = 'Guest') {
  try {
    const { data } = await api.post('auth/guest-login/', name ? { name } : {});
    if (data.success && (data.token || data.user)) {
      await applyAuthResponse(data);
      return { success: true };
    }
    return { success: false, error: data.message || 'Guest login failed' };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Guest login failed';
    return { success: false, error: msg };
  }
}

// --- Password Reset ---

export async function requestPasswordReset(email) {
  if (!email?.trim()) {
    return { success: false, error: 'Please enter your email' };
  }
  try {
    const { data } = await api.post('auth/password-reset/', {
      email: email.trim().toLowerCase(),
    });
    if (data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.message || 'Request failed' };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Request failed';
    return { success: false, error: msg };
  }
}

// --- Logout ---

export async function logout() {
  await clearAuth();
}

// --- Google (backend returns JWT) ---

export async function exchangeGoogleToken(idToken) {
  if (!idToken) return { success: false, error: 'No Google token' };
  try {
    const { data } = await api.post('auth/social/google/', {
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
        error: 'Google sign-in is not set up. Use Email to sign in.',
      };
    }
    const msg = err.response?.data?.message || err.message || 'Google sign-in failed';
    return { success: false, error: msg };
  }
}

// --- Apple (backend may have /api/auth/social/apple/) ---

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

    const { data } = await api.post('auth/social/apple/', {
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
        error: 'Apple sign-in is not set up. Use Email to sign in.',
      };
    }
    const msg = err.response?.data?.message || err.message || 'Apple sign-in failed';
    return { success: false, error: msg };
  }
}
