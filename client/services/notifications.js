/**
 * Push notification registration and handlers (Expo Push).
 * Register device after auth; unregister on logout. Deep link from notification taps.
 * In Expo Go (SDK 53+), push is not supported; we avoid loading expo-notifications at all
 * so the app runs without ERROR/WARN in Expo Go.
 */
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

let navigationRefGetter = null;

/** True when running in Expo Go; push notifications are not supported there (SDK 53+). */
const isExpoGo = Constants.appOwnership === 'expo';

/** Lazy-load expo-notifications only when not in Expo Go (avoids ERROR on import in Expo Go). */
function getNotifications() {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
}

/** Call from App.js after NavigationContainer ref is set. */
export function setNotificationNavigationRef(getRef) {
  navigationRefGetter = getRef;
}

function getNavigationRef() {
  return navigationRefGetter?.() ?? null;
}

const NotificationService = {
  /**
   * Request permission and register Expo push token with backend.
   * Call after user is authenticated.
   */
  async registerForPushNotifications() {
    if (isExpoGo || !Device.isDevice) return null;
    const Notifications = getNotifications();
    if (!Notifications) return null;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    const token = tokenData?.data ?? null;
    if (!token) return null;
    try {
      await api.post('notifications/register-device/', {
        expo_push_token: token,
        device_type: Platform.OS,
      });
    } catch (e) {
      // ignore; user may not be logged in yet
    }
    return token;
  },

  /**
   * Set foreground handler and response listener for notification taps (deep link).
   * Safe to call multiple times; listeners are registered once.
   */
  setupNotificationHandlers() {
    if (isExpoGo || this._handlersSetup) return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    this._handlersSetup = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification?.request?.content?.data ?? {};
      const nav = getNavigationRef()?.current;
      if (!nav?.isReady?.()) return;
      if (data.type === 'booking_reminder' && data.booking_id) {
        nav.navigate('myappointments', { bookingId: data.booking_id });
      } else if (data.type === 'order_update' && data.order_id) {
        nav.navigate('myorders', { orderId: data.order_id });
      } else if (data.type === 'booking_confirmation' && data.booking_id) {
        nav.navigate('myappointments', { bookingId: data.booking_id });
      } else if (data.shopId != null) {
        nav.navigate('ShopPublicProfile', { shopId: data.shopId });
      }
    });
  },

  /**
   * Deactivate current device token (call on logout).
   */
  async unregister() {
    try {
      await api.post('notifications/unregister-device/');
    } catch (e) {
      // ignore
    }
  },

  /**
   * Schedule a local notification as fallback (e.g. 1h before appointment).
   */
  async scheduleLocalReminder({ title, body, data, triggerDate }) {
    if (isExpoGo) return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {} },
      trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
    });
  },

  /**
   * Fetch unread count for badge.
   */
  async getUnreadCount() {
    try {
      const res = await api.get('notifications/unread-count/');
      return res.data?.unread_count ?? 0;
    } catch (e) {
      return 0;
    }
  },
};

export default NotificationService;
