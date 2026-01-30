"""Push notification service using Expo Push API."""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _should_send_to_user(user, category):
    """Check user notification preferences before sending."""
    try:
        from .models import NotificationPreference
        try:
            prefs = user.notification_preference
        except NotificationPreference.DoesNotExist:
            prefs = None
        if not prefs or not prefs.notifications_enabled:
            return False
        if category == 'booking_confirmation':
            return prefs.notify_booking_confirmations
        if category == 'booking_reminder_24h' or category == 'booking_reminder_1h':
            return prefs.notify_24h_reminders if '24h' in category else prefs.notify_1h_reminders
        if category == 'order_update':
            return prefs.notify_orders
        return True
    except Exception:
        return True


class PushNotificationService:
    EXPO_API_URL = 'https://exp.host/--/api/v2/push/send'

    @staticmethod
    def send_push(to_tokens, title, body, data=None, sound='default', badge=1):
        """Send push to multiple Expo tokens (batches of 100)."""
        if not to_tokens:
            return []
        to_tokens = list(set(t for t in to_tokens if t))
        if not to_tokens:
            return []
        messages = []
        for token in to_tokens[:100]:
            messages.append({
                'to': token,
                'title': title,
                'body': body,
                'data': data or {},
                'sound': sound,
                'badge': badge,
                'priority': 'high',
                'channelId': 'default',
            })
        try:
            response = requests.post(
                PushNotificationService.EXPO_API_URL,
                json=messages,
                headers={
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                timeout=10,
            )
            result = response.json()
            if isinstance(result, dict) and result.get('data'):
                for item in result.get('data', []):
                    if item.get('status') == 'error':
                        logger.warning('Expo push error: %s', item.get('message'))
            return result
        except requests.RequestException as e:
            logger.exception('Expo push request failed: %s', e)
            return {'data': [{'status': 'error', 'message': str(e)}]}

    @staticmethod
    def notify_user(user, title, body, data=None, category='general'):
        """Notify all active devices of a user (respects preferences)."""
        if not user:
            return None
        if not _should_send_to_user(user, category):
            return None
        from .models import PushDevice
        tokens = list(
            PushDevice.objects.filter(user=user, is_active=True)
            .values_list('expo_push_token', flat=True)
        )
        if not tokens:
            return None
        return PushNotificationService.send_push(tokens, title, body, data)

    @staticmethod
    def notify_barbershop_staff(barbershop, title, body, data=None, role_filter=None):
        """Notify barber and/or admins of a barbershop."""
        if not barbershop:
            return
        from barbershops.models import BarbershopStaff
        qs = BarbershopStaff.objects.filter(barbershop=barbershop, is_active=True).select_related('user')
        if role_filter:
            qs = qs.filter(role__in=role_filter)
        for staff in qs:
            PushNotificationService.notify_user(staff.user, title, body, data, category='booking_confirmation')
