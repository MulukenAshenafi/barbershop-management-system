from django.urls import path
from .views import booking_payment, get_all_payments

# Payment routes for /api/booking/payments
urlpatterns = [
    path('', booking_payment, name='booking-payment'),  # /api/booking/payments (POST)
    path('all', get_all_payments, name='all-payments'),  # /api/booking/payments/all (GET)
]
