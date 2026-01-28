from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """Get notifications for the logged-in user."""
    notifications = Notification.objects.filter(
        user=request.user
    ).order_by('-created_at')
    
    notifications_data = [{
        '_id': str(n.id),
        'userId': str(n.user.id),
        'message': n.message,
        'date': n.created_at.isoformat(),
        'isRead': n.is_read
    } for n in notifications]
    
    return Response({
        'success': True,
        'notifications': notifications_data
    })
