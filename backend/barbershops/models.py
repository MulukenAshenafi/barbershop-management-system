from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Avg, Count, Q
import re
import uuid

# Opening hours: { "monday": { "open": "09:00", "close": "18:00" }, ... }
OPENING_HOURS_DAY_KEYS = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]
TIME_PATTERN = re.compile(r'^([01]?\d|2[0-3]):([0-5]\d)$')


def validate_opening_hours(value):
    """Validate opening_hours JSON: day keys, open/close HH:MM, close >= open."""
    if value is None:
        return
    if not isinstance(value, dict):
        raise ValidationError('opening_hours must be a JSON object.')
    for day, hours in value.items():
        if day.lower() not in [d.lower() for d in OPENING_HOURS_DAY_KEYS]:
            raise ValidationError(f'Invalid day key: {day}. Use: {OPENING_HOURS_DAY_KEYS}.')
        if hours is None:
            continue
        if not isinstance(hours, dict):
            raise ValidationError(f'Day "{day}" must be an object with open/close.')
        open_str = hours.get('open')
        close_str = hours.get('close')
        if open_str is None and close_str is None:
            continue
        if not open_str or not close_str:
            raise ValidationError(f'Day "{day}" must have both "open" and "close".')
        if not TIME_PATTERN.match(str(open_str).strip()) or not TIME_PATTERN.match(str(close_str).strip()):
            raise ValidationError(f'Day "{day}": times must be HH:MM (e.g. 09:00, 18:00).')
        open_min = int(open_str[:2]) * 60 + int(open_str[3:5])
        close_min = int(close_str[:2]) * 60 + int(close_str[3:5])
        if close_min <= open_min:
            raise ValidationError(f'Day "{day}": close time must be after open time.')


class BarbershopQuerySet(models.QuerySet):
    """Exclude soft-deleted by default."""
    def available(self):
        return self.filter(deleted_at__isnull=True)


class BarbershopManager(models.Manager):
    def get_queryset(self):
        return BarbershopQuerySet(self.model, using=self._db).available()


class Barbershop(models.Model):
    """Multi-tenant barbershop model."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Subdomain for tenant (e.g. johns-barbershop-a1b2)
    subdomain = models.CharField(max_length=50, unique=True, db_index=True, blank=True)
    
    # Operating hours: JSON { "monday": { "open": "09:00", "close": "18:00" }, ... }
    opening_hours = models.JSONField(default=dict, blank=True, validators=[validate_opening_hours])
    # Legacy simple hours (kept for backward compatibility)
    opening_hour = models.IntegerField(default=8)
    closing_hour = models.IntegerField(default=18)
    
    # Logo (optional) – store URL after Cloudinary upload
    logo_url = models.URLField(blank=True, null=True)
    logo_public_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Owner/Admin
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_barbershops'
    )
    
    # Geo – for "barbershops near me" (Haversine in-app; optional PostGIS for spatial index)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Settings
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    subscription_status = models.CharField(max_length=20, default='trial')
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BarbershopManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'barbershops'
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['is_active']),
            models.Index(fields=['slug']),
            models.Index(fields=['subdomain']),
        ]

    def distance_from_km(self, lat, lng):
        """Return distance in km from (lat, lng) using Haversine, or None if no location."""
        if self.latitude is None or self.longitude is None:
            return None
        import math
        R = 6371  # Earth radius km
        lat1, lon1 = math.radians(float(self.latitude)), math.radians(float(self.longitude))
        lat2, lon2 = math.radians(float(lat)), math.radians(float(lng))
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    @property
    def average_rating(self):
        """Average rating (1-5) from approved reviews."""
        reviews = self.reviews.filter(is_approved=True)
        if not reviews.exists():
            return 0
        result = reviews.aggregate(avg=Avg('rating'))
        return round(float(result['avg'] or 0), 1)

    @property
    def total_reviews(self):
        """Count of approved reviews."""
        return self.reviews.filter(is_approved=True).count()

    def rating_breakdown(self):
        """Returns dict {5: n, 4: n, 3: n, 2: n, 1: n} for star distribution."""
        reviews = self.reviews.filter(is_approved=True)
        total = reviews.count()
        if not total:
            return {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        breakdown = reviews.values('rating').annotate(count=Count('id'))
        result = {i: 0 for i in range(1, 6)}
        for item in breakdown:
            result[item['rating']] = item['count']
        return result

    def __str__(self):
        return self.name


class BarbershopStaff(models.Model):
    """Many-to-many relationship between barbershops and staff (barbers/admins)."""
    barbershop = models.ForeignKey(
        Barbershop,
        on_delete=models.CASCADE,
        related_name='staff_members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='barbershop_affiliations'
    )
    role = models.CharField(
        max_length=20,
        choices=[
            ('Barber', 'Barber'),
            ('Admin', 'Admin'),
        ]
    )
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'barbershop_staff'
        unique_together = ['barbershop', 'user']
        indexes = [
            models.Index(fields=['barbershop', 'user']),
        ]
    
    def __str__(self):
        return f"{self.user.name} - {self.barbershop.name} ({self.role})"


class StaffInvitation(models.Model):
    """Invitation for a user to join barbershop as staff (Barber/Admin)."""
    barbershop = models.ForeignKey(
        Barbershop,
        on_delete=models.CASCADE,
        related_name='staff_invitations'
    )
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('Barber', 'Barber'),
            ('Admin', 'Admin'),
        ],
        default='Barber',
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'barbershop_staff_invitations'
        indexes = [models.Index(fields=['token']), models.Index(fields=['email', 'barbershop'])]

    def __str__(self):
        return f"{self.email} -> {self.barbershop.name} ({self.role})"


class Review(models.Model):
    """Customer review for a barbershop (optionally for a specific barber). Linked to booking or order for verification."""
    RATING_CHOICES = [(i, f'{i} Stars') for i in range(1, 6)]

    barbershop = models.ForeignKey(
        Barbershop,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    barber = models.ForeignKey(
        BarbershopStaff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews',
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='review',
    )
    order = models.OneToOneField(
        'services.Order',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='review',
    )
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField(max_length=1000)
    is_approved = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'barbershop_reviews'
        constraints = [
            models.UniqueConstraint(
                fields=['booking'],
                condition=Q(booking__isnull=False),
                name='unique_booking_review',
            ),
            models.UniqueConstraint(
                fields=['order'],
                condition=Q(order__isnull=False),
                name='unique_order_review',
            ),
        ]
        indexes = [
            models.Index(fields=['barbershop', '-created_at']),
            models.Index(fields=['barber', '-created_at']),
            models.Index(fields=['rating']),
        ]

    def save(self, *args, **kwargs):
        if self.booking_id and self.booking:
            if getattr(self.booking, 'payment_status', None) in ('Online Paid', 'Online Pending'):
                self.is_verified = True
        if self.order_id and self.order:
            if getattr(self.order, 'order_status', None) in ('delivered', 'Delivered'):
                self.is_verified = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Review {self.rating}★ by {self.customer.name} for {self.barbershop.name}'
