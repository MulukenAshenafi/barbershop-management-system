import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOMER_DATA = 'customerData';
const TOKEN = 'token';
const REFRESH_TOKEN = 'refreshToken';
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

export async function setAuth(data) {
  const { token, refreshToken, user } = data;
  if (token) await AsyncStorage.setItem(TOKEN, token);
  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN, refreshToken);
  if (user) {
    const customerData = {
      customerId: user.id ?? user._id,
      customerName: user.name ?? '',
      customerEmail: user.email ?? '',
      customerRole: user.role ?? '',
      customerPhone: user.phone ?? '',
      customerProfilePic: Array.isArray(user.profilePic) && user.profilePic[0]?.url
        ? user.profilePic[0].url
        : user.profilePic || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
      customerLocation: user.location ?? '',
      customerPreferences: user.preferences ?? '',
      customerSpecialization: user.specialization ?? '',
    };
    await AsyncStorage.setItem(CUSTOMER_DATA, JSON.stringify(customerData));
  }
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([
    CUSTOMER_DATA,
    TOKEN,
    REFRESH_TOKEN,
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
  const token = await AsyncStorage.getItem(TOKEN);
  return !!token;
}
