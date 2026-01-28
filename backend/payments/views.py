from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
from .models import Payment, PaymentWebhook
from .chapa_client import ChapaClient
from bookings.models import Booking
from services.models import Order
from accounts.permissions import IsAdminUser
from notifications.models import Notification
import json
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def booking_payment(request):
    """Initialize Chapa payment for booking."""
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
        
        amount = float(total_amount)
        
        if amount < 0.50:
            return Response({
                'success': False,
                'message': 'Amount must be at least 0.50 ETB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize Chapa client
        chapa = ChapaClient()
        
        # Generate unique transaction reference
        tx_ref = chapa.generate_tx_ref(prefix='BOOKING')
        
        # Get webhook URL from settings or construct it
        webhook_url = getattr(settings, 'CHAPA_WEBHOOK_URL', '')
        if not webhook_url:
            # Construct webhook URL from request
            webhook_url = f"{request.scheme}://{request.get_host()}/api/payments/webhook/chapa"
        
        # Initialize Chapa transaction
        chapa_response = chapa.initialize_transaction(
            amount=amount,
            currency='ETB',
            email=request.user.email,
            first_name=request.user.name.split()[0] if request.user.name else '',
            last_name=' '.join(request.user.name.split()[1:]) if len(request.user.name.split()) > 1 else '',
            phone_number=request.user.phone or '',
            tx_ref=tx_ref,
            callback_url=webhook_url,
            return_url=f"{request.scheme}://{request.get_host()}/payment/success",
            meta={
                'booking_id': str(booking.id),
                'user_id': str(request.user.id),
                'payment_type': 'booking'
            }
        )
        
        if chapa_response.get('status') != 'success':
            return Response({
                'success': False,
                'message': chapa_response.get('message', 'Failed to initialize payment')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            payment_type='booking',
            booking=booking,
            amount=amount,
            currency='ETB',
            payment_method='chapa',
            status='pending',
            chapa_transaction_id=tx_ref,
            chapa_reference=chapa_response.get('data', {}).get('reference', ''),
            metadata={
                'booking_id': str(booking.id),
                'chapa_response': chapa_response
            }
        )
        
        # Update booking with transaction reference (status will be updated via webhook)
        booking.payment_intent_id = tx_ref
        booking.payment_status = 'Online Pending'
        booking.save()
        
        # Return checkout URL for frontend redirect
        checkout_url = chapa_response.get('data', {}).get('checkout_url', '')
        
        return Response({
            'success': True,
            'checkout_url': checkout_url,
            'tx_ref': tx_ref,
            'message': 'Payment initialized successfully. Redirect to checkout_url to complete payment.'
        })
        
    except Exception as e:
        logger.error(f"Chapa payment initialization error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Error in Payment Processing API',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_payment(request):
    """Initialize Chapa payment for order."""
    total_amount = request.data.get('totalAmount')
    order_id = request.data.get('orderId')
    
    if not total_amount:
        return Response({
            'success': False,
            'message': 'TotalAmount is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        amount = float(total_amount)
        
        if amount < 0.50:
            return Response({
                'success': False,
                'message': 'Amount must be at least 0.50 ETB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get order if provided
        order = None
        if order_id:
            order = get_object_or_404(Order, pk=order_id, user=request.user)
        
        # Initialize Chapa client
        chapa = ChapaClient()
        
        # Generate unique transaction reference
        tx_ref = chapa.generate_tx_ref(prefix='ORDER')
        
        # Get webhook URL
        webhook_url = getattr(settings, 'CHAPA_WEBHOOK_URL', '')
        if not webhook_url:
            webhook_url = f"{request.scheme}://{request.get_host()}/api/payments/webhook/chapa"
        
        # Initialize Chapa transaction
        chapa_response = chapa.initialize_transaction(
            amount=amount,
            currency='ETB',
            email=request.user.email,
            first_name=request.user.name.split()[0] if request.user.name else '',
            last_name=' '.join(request.user.name.split()[1:]) if len(request.user.name.split()) > 1 else '',
            phone_number=request.user.phone or '',
            tx_ref=tx_ref,
            callback_url=webhook_url,
            return_url=f"{request.scheme}://{request.get_host()}/payment/success",
            meta={
                'order_id': str(order.id) if order else None,
                'user_id': str(request.user.id),
                'payment_type': 'order'
            }
        )
        
        if chapa_response.get('status') != 'success':
            return Response({
                'success': False,
                'message': chapa_response.get('message', 'Failed to initialize payment')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            payment_type='order',
            order=order,
            amount=amount,
            currency='ETB',
            payment_method='chapa',
            status='pending',
            chapa_transaction_id=tx_ref,
            chapa_reference=chapa_response.get('data', {}).get('reference', ''),
            metadata={
                'order_id': str(order.id) if order else None,
                'chapa_response': chapa_response
            }
        )
        
        checkout_url = chapa_response.get('data', {}).get('checkout_url', '')
        
        return Response({
            'success': True,
            'checkout_url': checkout_url,
            'tx_ref': tx_ref,
            'message': 'Payment initialized successfully. Redirect to checkout_url to complete payment.'
        })
        
    except Exception as e:
        logger.error(f"Chapa order payment error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Error in Payment Processing API',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Webhook should be publicly accessible but secured with signature
def chapa_webhook(request):
    """Handle Chapa payment webhook."""
    try:
        payload = request.data
        signature = request.headers.get('X-Chapa-Signature', '')
        
        # Verify webhook signature
        chapa = ChapaClient()
        if not chapa.verify_webhook_signature(request.body, signature):
            logger.warning(f"Invalid webhook signature: {signature}")
            return Response({
                'success': False,
                'message': 'Invalid signature'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Store webhook event
        webhook = PaymentWebhook.objects.create(
            event_type=payload.get('event', 'unknown'),
            payload=payload,
            signature=signature,
            processed=False
        )
        
        # Process webhook based on event type
        event_type = payload.get('event', '')
        tx_ref = payload.get('tx_ref', '')
        
        if event_type == 'charge.success':
            # Payment successful
            try:
                payment = Payment.objects.get(chapa_transaction_id=tx_ref)
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.metadata['webhook_data'] = payload
                payment.save()
                
                # Update booking/order status
                if payment.payment_type == 'booking' and payment.booking:
                    payment.booking.payment_status = 'Online Paid'
                    payment.booking.save()
                    
                    # Create notification
                    Notification.objects.create(
                        user=payment.user,
                        message=f'Your booking payment of {payment.amount} ETB has been confirmed!',
                        notification_type='payment',
                        related_booking=payment.booking
                    )
                
                elif payment.payment_type == 'order' and payment.order:
                    payment.order.payment_info_id = tx_ref
                    payment.order.payment_info_status = 'completed'
                    payment.order.paid_at = timezone.now()
                    payment.order.save()
                    
                    # Create notification
                    Notification.objects.create(
                        user=payment.user,
                        message=f'Your order payment of {payment.amount} ETB has been confirmed!',
                        notification_type='payment',
                        related_order=payment.order
                    )
                
                webhook.processed = True
                webhook.save()
                
            except Payment.DoesNotExist:
                logger.error(f"Payment not found for tx_ref: {tx_ref}")
        
        elif event_type == 'charge.failure':
            # Payment failed
            try:
                payment = Payment.objects.get(chapa_transaction_id=tx_ref)
                payment.status = 'failed'
                payment.metadata['webhook_data'] = payload
                payment.save()
                
                if payment.payment_type == 'booking' and payment.booking:
                    payment.booking.payment_status = 'Online Pending'
                    payment.booking.save()
                
                webhook.processed = True
                webhook.save()
                
            except Payment.DoesNotExist:
                logger.error(f"Payment not found for tx_ref: {tx_ref}")
        
        return Response({'success': True}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify a Chapa payment transaction."""
    tx_ref = request.data.get('tx_ref')
    
    if not tx_ref:
        return Response({
            'success': False,
            'message': 'tx_ref is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        chapa = ChapaClient()
        verification_response = chapa.verify_transaction(tx_ref)
        
        if verification_response.get('status') == 'success':
            data = verification_response.get('data', {})
            
            # Update payment record
            try:
                payment = Payment.objects.get(chapa_transaction_id=tx_ref)
                payment.status = 'completed' if data.get('status') == 'successful' else 'failed'
                payment.completed_at = timezone.now()
                payment.metadata['verification_data'] = data
                payment.save()
                
                # Update booking/order if payment successful
                if payment.status == 'completed':
                    if payment.payment_type == 'booking' and payment.booking:
                        payment.booking.payment_status = 'Online Paid'
                        payment.booking.save()
                    elif payment.payment_type == 'order' and payment.order:
                        payment.order.payment_info_id = tx_ref
                        payment.order.payment_info_status = 'completed'
                        payment.order.paid_at = timezone.now()
                        payment.order.save()
                
                return Response({
                    'success': True,
                    'payment_status': payment.status,
                    'verification_data': data
                })
            except Payment.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Payment record not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({
                'success': False,
                'message': verification_response.get('message', 'Verification failed')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Error verifying payment',
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
