"""Celery tasks for scheduled push notifications (booking reminders)."""
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def send_booking_reminders():
    """
    Send 24h and 1h booking reminders. Run via Celery Beat every 5 minutes.
    If Celery is not installed, this can be called from a cron job or management command.
    """
    try:
        from bookings.models import Booking
        from .services import PushNotificationService
    except ImportError:
        logger.warning('PushNotificationService or Booking not available for reminders')
        return

    now = timezone.now()

    # ---- 24h reminders: appointment in ~24 hours ----
    window_24h_start = now + timedelta(hours=23)
    window_24h_end = now + timedelta(hours=25)
    bookings_24h = Booking.objects.filter(
        slot__start_time__gte=window_24h_start,
        slot__start_time__lt=window_24h_end,
        notification_sent_24h=False,
        booking_status='Confirmed',
    ).select_related('customer', 'barber', 'slot', 'service')

    for booking in bookings_24h:
        try:
            slot_time = booking.slot.start_time.strftime('%H:%M') if booking.slot else ''
            PushNotificationService.notify_user(
                booking.customer,
                'Upcoming Appointment Tomorrow',
                f'Your appointment with {booking.barber.name} is tomorrow at {slot_time}',
                data={'type': 'booking_reminder', 'booking_id': str(booking.id)},
                category='booking_reminder_24h',
            )
            booking.notification_sent_24h = True
            booking.save(update_fields=['notification_sent_24h'])
        except Exception as e:
            logger.exception('Failed to send 24h reminder for booking %s: %s', booking.id, e)

    # ---- 1h reminders: appointment in ~1 hour ----
    window_1h_start = now + timedelta(minutes=55)
    window_1h_end = now + timedelta(minutes=65)
    bookings_1h = Booking.objects.filter(
        slot__start_time__gte=window_1h_start,
        slot__start_time__lt=window_1h_end,
        notification_sent_1h=False,
        booking_status='Confirmed',
    ).select_related('customer', 'barber', 'slot', 'service')

    for booking in bookings_1h:
        try:
            slot_time = booking.slot.start_time.strftime('%H:%M') if booking.slot else ''
            PushNotificationService.notify_user(
                booking.customer,
                'Appointment in 1 Hour',
                f'Your appointment with {booking.barber.name} is at {slot_time}. Heading to your appointment?',
                data={'type': 'booking_reminder', 'booking_id': str(booking.id)},
                category='booking_reminder_1h',
            )
            booking.notification_sent_1h = True
            booking.save(update_fields=['notification_sent_1h'])
        except Exception as e:
            logger.exception('Failed to send 1h reminder for booking %s: %s', booking.id, e)


# Celery shared_task (optional - only if celery is installed)
try:
    from celery import shared_task

    @shared_task
    def send_booking_reminders_task():
        """Celery task wrapper for send_booking_reminders."""
        send_booking_reminders()
except ImportError:
    send_booking_reminders_task = None
