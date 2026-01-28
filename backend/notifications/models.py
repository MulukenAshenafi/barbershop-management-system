from django.db import models
from django.conf import settings


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
