from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'message', 'is_read', 'notification_type', 'created_at']
    list_filter = ['is_read', 'notification_type', 'created_at']
    search_fields = ['user__name', 'message']
    raw_id_fields = ['user', 'related_booking', 'related_order']
    readonly_fields = ['created_at', 'read_at']
