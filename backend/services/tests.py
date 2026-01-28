"""
Tests for services app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Service, Product, Category

User = get_user_model()


class ServiceModelTest(TestCase):
    """Test Service model."""
    
    def setUp(self):
        self.service_data = {
            'name': 'Haircut',
            'description': 'Professional haircut service',
            'price': 500.00,
            'duration': '45 min',
            'category': 'Haircut'
        }
    
    def test_create_service(self):
        """Test service creation."""
        service = Service.objects.create(**self.service_data)
        self.assertEqual(service.name, self.service_data['name'])
        self.assertEqual(service.price, self.service_data['price'])
        self.assertIsNotNone(service.duration_minutes)
    
    def test_service_duration_parsing(self):
        """Test duration string parsing."""
        service = Service.objects.create(**self.service_data)
        self.assertEqual(service.duration_minutes, 45)


class ProductModelTest(TestCase):
    """Test Product model."""
    
    def setUp(self):
        self.product_data = {
            'name': 'Hair Gel',
            'description': 'Premium hair styling gel',
            'price': 250.00,
            'stock': 50,
            'category': 'Hair Care'
        }
    
    def test_create_product(self):
        """Test product creation."""
        product = Product.objects.create(**self.product_data)
        self.assertEqual(product.name, self.product_data['name'])
        self.assertEqual(product.stock, self.product_data['stock'])
        self.assertEqual(product.rating, 0.00)


class ServiceAPITest(TestCase):
    """Test Service API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@example.com',
            name='Admin',
            phone='1234567890',
            password='admin123',
            role='Admin'
        )
        self.service = Service.objects.create(
            name='Test Service',
            description='Test Description',
            price=100.00,
            duration='30 min',
            category='Haircut'
        )
    
    def test_get_all_services(self):
        """Test get all services endpoint."""
        response = self.client.get('/api/service/get-all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
