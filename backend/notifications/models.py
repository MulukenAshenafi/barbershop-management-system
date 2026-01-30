from django.db import models
from django.conf import settings


class PushDevice(models.Model):
    """Expo push token per device for push notifications."""
    DEVICE_TYPES = [('ios', 'iOS'), ('android', 'Android')]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_devices',
    )
    expo_push_token = models.CharField(max_length=200, unique=True)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    is_active = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'push_devices'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['expo_push_token']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.device_type}"


class NotificationPreference(models.Model):
    """Per-user notification preferences (checked before sending push)."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preference',
    )
    notifications_enabled = models.BooleanField(default=True)
    notify_booking_confirmations = models.BooleanField(default=True)
    notify_24h_reminders = models.BooleanField(default=True)
    notify_1h_reminders = models.BooleanField(default=True)
    notify_orders = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"Prefs for {self.user.email}"


class Notification(models.Model):
    """Notification model."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=50, blank=True)  # booking, order, payment, etc.
    related_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    related_order = models.ForeignKey(
        'services.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Notification for {self.user.name} - {self.message[:50]}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
