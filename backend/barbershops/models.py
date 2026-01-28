from django.db import models
from django.conf import settings


class Barbershop(models.Model):
    """Multi-tenant barbershop model."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Operating hours (8 AM - 6 PM default, can be customized)
    opening_hour = models.IntegerField(default=8)  # 8 AM
    closing_hour = models.IntegerField(default=18)  # 6 PM
    
    # Owner/Admin
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_barbershops'
    )
    
    # Settings
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'barbershops'
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['is_active']),
        ]
    
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
