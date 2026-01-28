from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from datetime import datetime, timedelta
from .models import Booking, TimeSlot
from .serializers import BookingSerializer, TimeSlotSerializer
from services.models import Service
from accounts.models import User
from accounts.permissions import IsAdminUser
from notifications.models import Notification
from barbershops.utils import filter_by_barbershop, get_barbershop_from_request
import re


def parse_duration(duration_str):
    """Parse duration from string (e.g., '45 min' to minutes)."""
    match = re.match(r'(\d+)\s*min', duration_str, re.IGNORECASE)
    return int(match.group(1)) if match else 0


def find_available_time_slot(existing_slots, service_duration, start_of_day, end_of_day):
    """Find available time slot using gap-finding algorithm."""
    previous_end_time = start_of_day
    
    # Sort slots by start_time
    sorted_slots = sorted(existing_slots, key=lambda x: x.start_time)
    
    for slot in sorted_slots:
        gap_duration = (slot.start_time - previous_end_time).total_seconds() / 60
        
        if gap_duration >= service_duration:
            return previous_end_time
        
        previous_end_time = slot.end_time
    
    # Check gap between last slot and end of day
    gap_duration = (end_of_day - previous_end_time).total_seconds() / 60
    if gap_duration >= service_duration:
        return previous_end_time
    
    return None


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for booking management."""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter bookings by user role and barbershop (multi-tenant)."""
        user = self.request.user
        barbershop_id = get_barbershop_from_request(self.request)
        
        if user.role == 'Admin':
            queryset = Booking.objects.select_related('customer', 'barber', 'service', 'slot').all()
        elif user.role == 'Barber':
            queryset = Booking.objects.filter(barber=user).select_related('customer', 'service', 'slot')
        else:
            queryset = Booking.objects.filter(customer=user).select_related('barber', 'service', 'slot')
        
        return filter_by_barbershop(queryset, barbershop_id)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def create_booking(self, request):
        """Create booking with dynamic slot management."""
        data = request.data
        service_id = data.get('serviceId')
        barber_id = data.get('barberId')
        customer_id = data.get('customerId')
        booking_time_str = data.get('bookingTime')
        customer_notes = data.get('customerNotes', '')
        payment_status = data.get('paymentStatus', 'Pending to be paid on cash')
        
        if not all([service_id, barber_id, customer_id, booking_time_str]):
            return Response({
                'error': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get barbershop from request context
        barbershop = getattr(request, 'barbershop', None)
        
        try:
            service = get_object_or_404(Service, pk=service_id)
            # Verify service belongs to barbershop if multi-tenant is active
            if barbershop and service.barbershop and service.barbershop != barbershop:
                return Response({
                    'error': 'Service does not belong to this barbershop'
                }, status=status.HTTP_403_FORBIDDEN)
            
            barber = get_object_or_404(User, pk=barber_id, role='Barber')
            customer = get_object_or_404(User, pk=customer_id, role='Customer')
            
            booking_time = datetime.fromisoformat(booking_time_str.replace('Z', '+00:00'))
            booking_date = booking_time.date()
            
            service_duration = parse_duration(service.duration)
            if service_duration == 0:
                return Response({
                    'error': 'Invalid service duration'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Operating hours: 8 AM - 6 PM
            start_of_day = timezone.make_aware(datetime.combine(booking_date, datetime.min.time().replace(hour=8)))
            end_of_day = timezone.make_aware(datetime.combine(booking_date, datetime.min.time().replace(hour=18)))
            
            # Get existing slots for this barber and date
            existing_slots = TimeSlot.objects.filter(
                barber=barber,
                date=booking_date,
                is_booked=True
            ).order_by('start_time')
            
            # Check for overlap
            for slot in existing_slots:
                if (booking_time >= slot.start_time and booking_time < slot.end_time) or \
                   (booking_time < slot.start_time and 
                    booking_time + timedelta(minutes=service_duration) > slot.start_time):
                    return Response({
                        'error': f'Slot from {slot.start_time.strftime("%H:%M")} to {slot.end_time.strftime("%H:%M")} overlaps with your selected time.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find available time slot
            available_start_time = find_available_time_slot(
                existing_slots,
                service_duration,
                start_of_day,
                end_of_day
            )
            
            if not available_start_time:
                return Response({
                    'error': 'No available time slot for this service'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            available_end_time = available_start_time + timedelta(minutes=service_duration)
            
            # Create time slot
            time_slot = TimeSlot.objects.create(
                barber=barber,
                barbershop=barbershop,
                start_time=available_start_time,
                end_time=available_end_time,
                date=booking_date,
                is_booked=True
            )
            
            # Create booking
            booking = Booking.objects.create(
                barbershop=barbershop,
                customer=customer,
                barber=barber,
                service=service,
                slot=time_slot,
                booking_time=available_start_time,
                payment_status=payment_status,
                booking_status='Confirmed',
                customer_notes=customer_notes
            )
            
            # Create notification
            Notification.objects.create(
                user=customer,
                message=f'Your booking for {service.name} with the barber has been confirmed!',
                notification_type='booking',
                related_booking=booking
            )
            
            serializer = self.get_serializer(booking)
            return Response({
                'booking': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Server error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def availability(self, request):
        """Check slot availability for a barber on a specific date."""
        barber_id = request.query_params.get('barberId')
        date_str = request.query_params.get('date')
        
        if not barber_id or not date_str:
            return Response({
                'error': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            barber = get_object_or_404(User, pk=barber_id, role='Barber')
            
            # Get available (unbooked) slots
            available_slots = TimeSlot.objects.filter(
                barber=barber,
                date=booking_date,
                is_booked=False
            )
            
            serializer = TimeSlotSerializer(available_slots, many=True)
            return Response({
                'availableSlots': serializer.data
            })
        except Exception as e:
            return Response({
                'error': 'Server error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def get_all(self, request):
        """Get all bookings (admin only)."""
        bookings = Booking.objects.select_related('customer', 'barber', 'service', 'slot').all()
        
        if not bookings.exists():
            return Response({
                'success': False,
                'message': 'No bookings found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(bookings, many=True)
        return Response({
            'success': True,
            'bookings': serializer.data
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a booking (admin only)."""
        booking = get_object_or_404(Booking, pk=pk)
        
        if booking.booking_status == 'Approved':
            return Response({
                'success': False,
                'message': 'Booking is already approved'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        booking.booking_status = 'Approved'
        booking.save()
        
        # Create notification
        Notification.objects.create(
            user=booking.customer,
            message=f'Your booking for service {booking.service.name} has been approved!',
            notification_type='booking',
            related_booking=booking
        )
        
        serializer = self.get_serializer(booking)
        return Response({
            'success': True,
            'message': 'Booking approved successfully',
            'booking': serializer.data
        })
