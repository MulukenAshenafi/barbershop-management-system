"""Review create/update/delete under /api/reviews/."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_create(request):
    """
    POST /api/reviews/
    Create review (requires booking_id or order_id in body). Authenticated only.
    """
    serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(
            {'success': False, 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    review = serializer.save()
    out = ReviewSerializer(review, context={'request': request})
    return Response({'success': True, 'review': out.data}, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, pk):
    """
    PATCH /api/reviews/<id>/ - Update own review (within 24h).
    DELETE /api/reviews/<id>/ - Delete own review.
    """
    review = get_object_or_404(Review, pk=pk)
    if review.customer_id != request.user.id:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    # PATCH: only within 24h
    delta = timezone.now() - review.created_at
    if delta.days >= 1:
        return Response(
            {'detail': 'Reviews can only be edited within 24 hours.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer = ReviewSerializer(review, data=request.data, partial=True, context={'request': request})
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    # Only allow updating rating and comment
    for key in ('rating', 'comment'):
        if key in request.data:
            setattr(review, key, request.data[key])
    review.save(update_fields=['rating', 'comment', 'updated_at'])
    out = ReviewSerializer(review, context={'request': request})
    return Response({'success': True, 'review': out.data})
