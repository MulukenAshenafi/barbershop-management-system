from django.urls import path
from .views import booking_payment, order_payment, chapa_webhook, get_all_payments, verify_payment

# Payment routes for /api/booking/payments
urlpatterns = [
    path('', booking_payment, name='booking-payment'),  # /api/booking/payments (POST)
    path('all', get_all_payments, name='all-payments'),  # /api/booking/payments/all (GET)
    path('verify', verify_payment, name='verify-payment'),  # /api/booking/payments/verify (POST)
]
