"""
Pytest configuration and fixtures.
"""
import pytest
from django.contrib.auth import get_user_model
from barbershops.models import Barbershop
from services.models import Service, Product
from bookings.models import Booking, TimeSlot

User = get_user_model()


@pytest.fixture
def customer_user(db):
    """Create a customer user."""
    return User.objects.create_user(
        email='customer@test.com',
        name='Test Customer',
        phone='1234567890',
        password='testpass123',
        role='Customer'
    )


@pytest.fixture
def barber_user(db):
    """Create a barber user."""
    return User.objects.create_user(
        email='barber@test.com',
        name='Test Barber',
        phone='0987654321',
        password='testpass123',
        role='Barber'
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_superuser(
        email='admin@test.com',
        name='Test Admin',
        phone='5555555555',
        password='adminpass123'
    )


@pytest.fixture
def barbershop(db, admin_user):
    """Create a barbershop."""
    return Barbershop.objects.create(
        name='Test Barbershop',
        owner=admin_user,
        city='Test City',
        country='Ethiopia'
    )


@pytest.fixture
def service(db, barbershop):
    """Create a service."""
    return Service.objects.create(
        barbershop=barbershop,
        name='Haircut',
        description='Professional haircut',
        price=500.00,
        duration='45 min',
        category='Haircut'
    )


@pytest.fixture
def product(db, barbershop):
    """Create a product."""
    return Product.objects.create(
        barbershop=barbershop,
        name='Hair Gel',
        description='Premium gel',
        price=250.00,
        stock=50,
        category='Hair Care'
    )
