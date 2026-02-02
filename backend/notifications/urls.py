from django.urls import path
from .views import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    register_device,
    unregister_device,
    my_devices,
    preferences,
    unread_count,
)

urlpatterns = [
    path('', get_user_notifications, name='user-notifications'),
    path('read/<int:pk>', mark_notification_read, name='mark-notification-read'),
    path('read-all', mark_all_notifications_read, name='mark-all-notifications-read'),
    path('register-device/', register_device, name='register-device'),
    path('unregister-device/', unregister_device, name='unregister-device'),
    path('my-devices/', my_devices, name='my-devices'),
    path('preferences/', preferences, name='preferences'),
    path('unread-count/', unread_count, name='unread-count'),
]
