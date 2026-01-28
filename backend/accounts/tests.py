"""
Tests for accounts app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import json

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model."""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'name': 'Test User',
            'phone': '1234567890',
            'password': 'testpass123'
        }
    
    def test_create_user(self):
        """Test user creation."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.name, self.user_data['name'])
        self.assertEqual(user.role, 'Customer')
        self.assertTrue(user.check_password(self.user_data['password']))
    
    def test_create_superuser(self):
        """Test superuser creation."""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin User',
            phone='1234567890',
            password='adminpass123'
        )
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)
        self.assertEqual(superuser.role, 'Admin')


class UserAPITest(TestCase):
    """Test User API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            phone='1234567890',
            password='testpass123'
        )
    
    def test_user_signup(self):
        """Test user registration."""
        data = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'phone': '9876543210',
            'password': 'newpass123',
            'location': 'Test Location'
        }
        response = self.client.post('/api/customers/signup', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
    
    def test_user_login(self):
        """Test user login."""
        data = {
            'username': 'Test User',
            'password': 'testpass123'
        }
        response = self.client.post('/api/customers/login', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data)
    
    def test_get_profile(self):
        """Test get user profile."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/customers/profile')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
