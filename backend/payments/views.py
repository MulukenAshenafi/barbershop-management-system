from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import Payment, PaymentWebhook
from bookings.models import Booking
from services.models import Order
from accounts.permissions import IsAdminUser
import json


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def booking_payment(request):
    """Create payment intent for booking (Chapa placeholder)."""
    total_amount = request.data.get('totalAmount')
    booking_id = request.data.get('bookingId')
    
    if not total_amount or not booking_id:
        return Response({
            'success': False,
            'message': 'TotalAmount and BookingId are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        booking = get_object_or_404(Booking, pk=booking_id)
        
        if booking.payment_status == 'Online Paid':
            return Response({
                'success': False,
                'message': 'Duplicate payment detected: this booking has already been paid'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to cents (or smallest currency unit)
        amount_cents = int(float(total_amount) * 100)  # Assuming ETB, adjust as needed
        
        if amount_cents < 50:
            return Response({
                'success': False,
                'message': 'Amount must be at least 0.50 ETB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Integrate with Chapa payment gateway
        # For now, create a mock payment intent
        # In production, this would call Chapa API to create a payment intent
        
        # Mock client_secret (replace with actual Chapa integration)
        client_secret = f"chapa_test_{booking_id}_{amount_cents}"
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            payment_type='booking',
            booking=booking,
            amount=float(total_amount),
            currency='ETB',
            payment_method='chapa',
            status='pending',
            metadata={'booking_id': str(booking.id)}
        )
        
        # Update booking payment status (NOTE: In production, this should only happen after webhook confirmation)
        booking.payment_status = 'Online Paid'
        booking.payment_intent_id = client_secret
        booking.save()
        
        return Response({
            'success': True,
            'client_secret': client_secret
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Error in Payment Processing API',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_payment(request):
    """Create payment intent for order (Chapa placeholder)."""
    total_amount = request.data.get('totalAmount')
    
    if not total_amount:
        return Response({
            'success': False,
            'message': 'TotalAmount is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Convert to cents
        amount_cents = int(float(total_amount) * 100)
        
        if amount_cents < 50:
            return Response({
                'success': False,
                'message': 'Amount must be at least 0.50 ETB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Integrate with Chapa payment gateway
        # Mock client_secret
        client_secret = f"chapa_test_order_{amount_cents}"
        
        return Response({
            'success': True,
            'client_secret': client_secret
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Error in Payment Processing API',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Webhook should be publicly accessible but secured with signature
def chapa_webhook(request):
    """Handle Chapa payment webhook (placeholder)."""
    try:
        # TODO: Verify webhook signature from Chapa
        # signature = request.headers.get('X-Chapa-Signature')
        # verify_signature(signature, request.body)
        
        payload = request.data
        
        # Store webhook event
        webhook = PaymentWebhook.objects.create(
            event_type=payload.get('event', 'unknown'),
            payload=payload,
            signature=request.headers.get('X-Chapa-Signature', ''),
            processed=False
        )
        
        # TODO: Process webhook based on event type
        # Example: Update payment status, booking status, etc.
        
        # For now, mark as processed
        webhook.processed = True
        webhook.save()
        
        return Response({'success': True}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_all_payments(request):
    """Get all payments (admin only)."""
    # Get payments from bookings
    bookings = Booking.objects.filter(
        payment_status__in=['Online Paid', 'Pending to be paid on cash']
    ).select_related('customer', 'barber', 'service', 'slot')
    
    payments_data = []
    for booking in bookings:
        payments_data.append({
            '_id': str(booking.id),
            'customerId': {
                '_id': str(booking.customer.id),
                'name': booking.customer.name,
                'email': booking.customer.email
            },
            'barberId': {
                '_id': str(booking.barber.id),
                'name': booking.barber.name,
                'email': booking.barber.email
            },
            'serviceId': {
                '_id': str(booking.service.id),
                'name': booking.service.name
            },
            'slotId': {
                '_id': str(booking.slot.id),
                'startTime': booking.slot.start_time.isoformat(),
                'endTime': booking.slot.end_time.isoformat()
            },
            'paymentStatus': booking.payment_status,
            'bookingTime': booking.booking_time.isoformat(),
            'amount': float(booking.service.price)
        })
    
    if not payments_data:
        return Response({
            'success': False,
            'message': 'No payments found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'success': True,
        'payments': payments_data
    })
