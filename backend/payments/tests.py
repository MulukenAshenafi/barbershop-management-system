"""
Tests for payments app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Payment
from bookings.models import Booking
from services.models import Service
from accounts.models import User

User = get_user_model()


class PaymentModelTest(TestCase):
    """Test Payment model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            name='User',
            phone='1234567890',
            password='pass123'
        )
    
    def test_create_payment(self):
        """Test payment creation."""
        payment = Payment.objects.create(
            user=self.user,
            payment_type='booking',
            amount=500.00,
            currency='ETB',
            payment_method='chapa',
            status='pending'
        )
        self.assertEqual(payment.amount, 500.00)
        self.assertEqual(payment.status, 'pending')
