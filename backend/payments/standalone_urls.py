from django.urls import path
from .views import booking_payment, order_payment, chapa_webhook, get_all_payments

urlpatterns = [
    path('booking', booking_payment, name='booking-payment-standalone'),
    path('order', order_payment, name='order-payment-standalone'),
    path('webhook/chapa', chapa_webhook, name='chapa-webhook'),
    path('all', get_all_payments, name='all-payments-standalone'),
]
