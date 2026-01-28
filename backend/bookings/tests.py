"""
Tests for bookings app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import Booking, TimeSlot
from services.models import Service
from accounts.models import User

User = get_user_model()


class BookingModelTest(TestCase):
    """Test Booking model."""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@example.com',
            name='Customer',
            phone='1234567890',
            password='pass123',
            role='Customer'
        )
        self.barber = User.objects.create_user(
            email='barber@example.com',
            name='Barber',
            phone='0987654321',
            password='pass123',
            role='Barber'
        )
        self.service = Service.objects.create(
            name='Haircut',
            description='Test',
            price=500.00,
            duration='45 min',
            category='Haircut'
        )
    
    def test_create_booking(self):
        """Test booking creation."""
        booking_time = timezone.now() + timedelta(days=1)
        slot = TimeSlot.objects.create(
            barber=self.barber,
            start_time=booking_time,
            end_time=booking_time + timedelta(minutes=45),
            date=booking_time.date(),
            is_booked=True
        )
        
        booking = Booking.objects.create(
            customer=self.customer,
            barber=self.barber,
            service=self.service,
            slot=slot,
            booking_time=booking_time,
            payment_status='Pending to be paid on cash',
            booking_status='Confirmed'
        )
        
        self.assertEqual(booking.customer, self.customer)
        self.assertEqual(booking.barber, self.barber)
        self.assertEqual(booking.booking_status, 'Confirmed')
