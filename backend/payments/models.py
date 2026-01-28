from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Payment(models.Model):
    """Payment model for audit trail."""
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_TYPES = [
        ('booking', 'Booking'),
        ('order', 'Order'),
    ]
    
    barbershop = models.ForeignKey(
        'barbershops.Barbershop',
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,  # Allow null for migration period
        blank=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_records'
    )
    order = models.ForeignKey(
        'services.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_records'
    )
    
    # Payment details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='ETB')  # Ethiopian Birr for Chapa
    payment_method = models.CharField(max_length=50)  # Chapa, Stripe, Cash, etc.
    
    # Chapa payment gateway fields
    chapa_transaction_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    chapa_reference = models.CharField(max_length=255, blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        indexes = [
            models.Index(fields=['barbershop']),
            models.Index(fields=['user']),
            models.Index(fields=['payment_type']),
            models.Index(fields=['status']),
            models.Index(fields=['chapa_transaction_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Payment #{self.id} - {self.amount} {self.currency} ({self.status})"


class PaymentWebhook(models.Model):
    """Webhook events from payment gateway (Chapa)."""
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    signature = models.CharField(max_length=255, blank=True)
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_webhooks'
        indexes = [
            models.Index(fields=['processed']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Webhook - {self.event_type} ({'Processed' if self.processed else 'Pending'})"
