import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOMER_DATA = 'customerData';
const TOKEN = 'token';
const REFRESH_TOKEN = 'refreshToken';
export const FIREBASE_AUTH_FLAG = 'firebaseAuth';
export const EMAIL_LINK_EMAIL = 'emailLinkEmail';
export const ACTIVE_BARBERSHOP_ID = 'active_barbershop_id';
export const USER_ROLE_PREFERENCE = 'user_role_preference';
export const PENDING_INVITE_TOKEN = 'pending_invite_token';

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN);
}

export async function getStoredCustomer() {
  const raw = await AsyncStorage.getItem(CUSTOMER_DATA);
  return raw ? JSON.parse(raw) : null;
}

function userToCustomerData(user) {
  const pic = user.profilePic ?? user.profile_pic;
  const profilePicUrl =
    (Array.isArray(pic) && pic[0]?.url) ? pic[0].url
    : (pic && typeof pic === 'object' && pic.url) ? pic.url
    : (typeof pic === 'string' ? pic : null) || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
  return {
    customerId: user.id ?? user._id,
    customerName: user.name ?? '',
    customerEmail: user.email ?? '',
    customerRole: user.role ?? '',
    customerPhone: user.phone ?? '',
    customerProfilePic: profilePicUrl,
    customerLocation: user.location ?? '',
    customerPreferences: user.preferences ?? '',
    customerSpecialization: user.specialization ?? '',
  };
}

export async function setAuth(data) {
  const { token, refreshToken, user } = data;
  if (token) await AsyncStorage.setItem(TOKEN, token);
  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN, refreshToken);
  if (user) {
    await AsyncStorage.setItem(CUSTOMER_DATA, JSON.stringify(userToCustomerData(user)));
  }
}

/** Update stored customer data from API user (e.g. after profile update). Preserves token. */
export async function updateStoredUser(user) {
  if (!user) return;
  await AsyncStorage.setItem(CUSTOMER_DATA, JSON.stringify(userToCustomerData(user)));
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([
    CUSTOMER_DATA,
    TOKEN,
    REFRESH_TOKEN,
    FIREBASE_AUTH_FLAG,
    EMAIL_LINK_EMAIL,
    ACTIVE_BARBERSHOP_ID,
    USER_ROLE_PREFERENCE,
  ]);
}

export async function getActiveBarbershopId() {
  return AsyncStorage.getItem(ACTIVE_BARBERSHOP_ID);
}

export async function setActiveBarbershopId(id) {
  if (id == null) {
    await AsyncStorage.removeItem(ACTIVE_BARBERSHOP_ID);
  } else {
    await AsyncStorage.setItem(ACTIVE_BARBERSHOP_ID, String(id));
  }
}

export async function getRolePreference() {
  return AsyncStorage.getItem(USER_ROLE_PREFERENCE);
}

export async function setRolePreference(role) {
  if (role == null) {
    await AsyncStorage.removeItem(USER_ROLE_PREFERENCE);
  } else {
    await AsyncStorage.setItem(USER_ROLE_PREFERENCE, role);
  }
}

export async function getPendingInviteToken() {
  return AsyncStorage.getItem(PENDING_INVITE_TOKEN);
}

export async function setPendingInviteToken(token) {
  if (token == null) {
    await AsyncStorage.removeItem(PENDING_INVITE_TOKEN);
  } else {
    await AsyncStorage.setItem(PENDING_INVITE_TOKEN, String(token));
  }
}

export async function isAuthenticated() {
  const firebaseMode = await AsyncStorage.getItem(FIREBASE_AUTH_FLAG);
  if (firebaseMode) {
    try {
      const { getFirebaseAuth } = require('./firebase');
      const auth = getFirebaseAuth();
      return !!auth?.currentUser;
    } catch (_) {
      return false;
    }
  }
  const token = await AsyncStorage.getItem(TOKEN);
  return !!token;
}
