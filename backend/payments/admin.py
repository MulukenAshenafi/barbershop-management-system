from django.contrib import admin
from .models import Payment, PaymentWebhook


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'payment_type', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['payment_type', 'status', 'created_at']
    search_fields = ['user__name', 'user__email', 'chapa_transaction_id']
    raw_id_fields = ['user', 'booking', 'order', 'barbershop']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']


@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_type', 'processed', 'created_at']
    list_filter = ['event_type', 'processed', 'created_at']
    readonly_fields = ['created_at']
