# Backend - Django REST API

This directory contains the Django REST Framework backend for the Barbershop Management System.

## Quick Setup

See the main [README.md](../README.md) for complete setup instructions.

## Apps Structure

- `accounts/` - User authentication and management
- `barbershops/` - Multi-tenant barbershop model
- `services/` - Services, products, orders, categories
- `bookings/` - Booking and time slot management
- `payments/` - Payment processing (Chapa integration)
- `notifications/` - User notification system

## Environment Variables

Copy `.env.example` to `.env` and configure:
- Database credentials (PostgreSQL)
- Cloudinary credentials (image storage)
- Chapa credentials (payment gateway)
- Firebase credentials (social login, optional)

## Development

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

## API Base URL

Default: `http://localhost:8000/api`

Update `client/config.js` to match your backend URL.
