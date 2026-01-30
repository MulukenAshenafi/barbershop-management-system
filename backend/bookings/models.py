from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class TimeSlot(models.Model):
    """Time slot model for barber availability."""
    barber = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='time_slots',
        limit_choices_to={'role': 'Barber'}
    )
    barbershop = models.ForeignKey(
        'barbershops.Barbershop',
        on_delete=models.CASCADE,
        related_name='time_slots',
        null=True,  # Allow null for migration period
        blank=True
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    date = models.DateField()  # For easier querying by date
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'time_slots'
        indexes = [
            models.Index(fields=['barber', 'date']),
            models.Index(fields=['barbershop', 'date']),
            models.Index(fields=['is_booked']),
            models.Index(fields=['start_time', 'end_time']),
        ]
    
    def __str__(self):
        return f"{self.barber.name} - {self.start_time} to {self.end_time}"


class Booking(models.Model):
    """Booking model."""
    PAYMENT_STATUS = [
        ('Pending to be paid on cash', 'Pending to be paid on cash'),
        ('Online Paid', 'Online Paid'),
        ('Online Pending', 'Online Pending'),
    ]
    
    BOOKING_STATUS = [
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
        ('Approved', 'Approved'),
    ]
    
    barbershop = models.ForeignKey(
        'barbershops.Barbershop',
        on_delete=models.CASCADE,
        related_name='bookings',
        null=True,  # Allow null for migration period
        blank=True
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_bookings',
        limit_choices_to={'role': 'Customer'}
    )
    barber = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='barber_bookings',
        limit_choices_to={'role': 'Barber'}
    )
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    slot = models.OneToOneField(
        TimeSlot,
        on_delete=models.CASCADE,
        related_name='booking'
    )
    booking_time = models.DateTimeField()
    payment_status = models.CharField(
        max_length=50,
        choices=PAYMENT_STATUS,
        default='Pending to be paid on cash'
    )
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    booking_status = models.CharField(
        max_length=20,
        choices=BOOKING_STATUS,
        default='Confirmed'
    )
    customer_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Push reminder tracking (Celery beat sends 24h/1h before)
    notification_sent_24h = models.BooleanField(default=False)
    notification_sent_1h = models.BooleanField(default=False)

    class Meta:
        db_table = 'bookings'
        indexes = [
            models.Index(fields=['barbershop']),
            models.Index(fields=['customer']),
            models.Index(fields=['barber']),
            models.Index(fields=['service']),
            models.Index(fields=['booking_time']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['booking_status']),
        ]
    
    def __str__(self):
        return f"Booking #{self.id} - {self.customer.name} with {self.barber.name}"
