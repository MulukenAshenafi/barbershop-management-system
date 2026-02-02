from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Notification, PushDevice, NotificationPreference


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """Get notifications for the logged-in user with pagination."""
    qs = Notification.objects.filter(user=request.user).order_by('-created_at')
    paginator = NotificationPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        notifications_data = [{
            '_id': str(n.id),
            'userId': str(n.user.id),
            'message': n.message,
            'date': n.created_at.isoformat(),
            'isRead': n.is_read,
            'notificationType': n.notification_type or '',
        } for n in page]
        return Response({
            'success': True,
            'notifications': notifications_data,
            'total': paginator.page.paginator.count,
            'page': paginator.page.number,
            'pageSize': paginator.page.paginator.per_page,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
        })
    notifications_data = [{
        '_id': str(n.id),
        'userId': str(n.user.id),
        'message': n.message,
        'date': n.created_at.isoformat(),
        'isRead': n.is_read,
        'notificationType': n.notification_type or '',
    } for n in qs]
    return Response({
        'success': True,
        'notifications': notifications_data
    })


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk=None):
    """Mark a single notification as read."""
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.mark_as_read()
    return Response({
        'success': True,
        'notification': {
            '_id': str(notification.id),
            'message': notification.message,
            'isRead': notification.is_read,
            'date': notification.created_at.isoformat(),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications for the user as read."""
    updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({
        'success': True,
        'message': f'{updated} notification(s) marked as read.'
    })


# ---- Push device registration ----

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_device(request):
    """
    POST /api/notifications/register-device/
    Store/update expo_push_token. Idempotent: if token exists for this user, update last_used;
    if token exists for another user, reassign to this user.
    """
    token = (request.data.get('expo_push_token') or request.data.get('expoPushToken') or '').strip()
    device_type = (request.data.get('device_type') or request.data.get('deviceType') or 'android').lower()
    if device_type not in ('ios', 'android'):
        device_type = 'android'
    language = (request.data.get('language') or request.data.get('language') or 'en')[:10]

    if not token:
        return Response(
            {'success': False, 'message': 'expo_push_token is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    device, created = PushDevice.objects.update_or_create(
        expo_push_token=token,
        defaults={
            'user': request.user,
            'device_type': device_type,
            'language': language,
            'is_active': True,
            'last_used': timezone.now(),
        },
    )
    if not created:
        device.last_used = timezone.now()
        device.save(update_fields=['last_used', 'user', 'device_type', 'language', 'is_active'])

    return Response({
        'success': True,
        'message': 'Device registered',
        'device_id': device.id,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_device(request):
    """
    POST /api/notifications/unregister-device/
    Soft delete: set is_active=False for this user's device(s).
    Optional body: expo_push_token to deactivate only that token.
    """
    token = (request.data.get('expo_push_token') or request.data.get('expoPushToken') or '').strip()
    if token:
        updated = PushDevice.objects.filter(user=request.user, expo_push_token=token).update(is_active=False)
    else:
        updated = PushDevice.objects.filter(user=request.user).update(is_active=False)
    return Response({
        'success': True,
        'message': f'{updated} device(s) deactivated.',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_devices(request):
    """GET /api/notifications/my-devices/ - List user's registered devices."""
    devices = PushDevice.objects.filter(user=request.user).order_by('-last_used')
    data = [{
        'id': d.id,
        'expo_push_token': d.expo_push_token[:20] + '...' if len(d.expo_push_token) > 20 else d.expo_push_token,
        'device_type': d.device_type,
        'is_active': d.is_active,
        'language': d.language,
        'created_at': d.created_at.isoformat(),
        'last_used': d.last_used.isoformat(),
    } for d in devices]
    return Response({'success': True, 'devices': data})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def preferences(request):
    """
    GET /api/notifications/preferences/ - Get notification preferences.
    PATCH - Update preferences (notifications_enabled, notify_booking_confirmations, etc.).
    """
    prefs, _ = NotificationPreference.objects.get_or_create(
        user=request.user,
        defaults={
            'notifications_enabled': True,
            'notify_booking_confirmations': True,
            'notify_24h_reminders': True,
            'notify_1h_reminders': True,
            'notify_orders': True,
        },
    )
    if request.method == 'GET':
        return Response({
            'success': True,
            'preferences': {
                'notifications_enabled': prefs.notifications_enabled,
                'notify_booking_confirmations': prefs.notify_booking_confirmations,
                'notify_24h_reminders': prefs.notify_24h_reminders,
                'notify_1h_reminders': prefs.notify_1h_reminders,
                'notify_orders': prefs.notify_orders,
            },
        })
    # PATCH
    for key in ['notifications_enabled', 'notify_booking_confirmations', 'notify_24h_reminders',
                 'notify_1h_reminders', 'notify_orders']:
        if key in request.data:
            setattr(prefs, key, bool(request.data[key]))
    prefs.save()
    return Response({
        'success': True,
        'preferences': {
            'notifications_enabled': prefs.notifications_enabled,
            'notify_booking_confirmations': prefs.notify_booking_confirmations,
            'notify_24h_reminders': prefs.notify_24h_reminders,
            'notify_1h_reminders': prefs.notify_1h_reminders,
            'notify_orders': prefs.notify_orders,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """GET /api/notifications/unread-count/ - Unread notification count for badge."""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'success': True, 'unread_count': count})
