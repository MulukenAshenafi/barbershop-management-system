from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction, IntegrityError
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
    
    def _slot_within_opening_hours(self, barbershop, booking_date, start_time, end_time):
        """Return True if slot [start_time, end_time] is within barbershop opening_hours for that day."""
        if not barbershop or not getattr(barbershop, 'opening_hours', None):
            return True
        hours = barbershop.opening_hours or {}
        day_key = start_time.strftime('%A').lower()
        day_hours = hours.get(day_key) or hours.get(day_key.capitalize())
        if not day_hours or not day_hours.get('open') or not day_hours.get('close'):
            return True
        open_str, close_str = day_hours['open'], day_hours['close']
        try:
            open_dt = timezone.make_aware(datetime.combine(
                booking_date,
                datetime.strptime(open_str, '%H:%M').time()
            ))
            close_dt = timezone.make_aware(datetime.combine(
                booking_date,
                datetime.strptime(close_str, '%H:%M').time()
            ))
        except (ValueError, TypeError):
            return True
        return start_time >= open_dt and end_time <= close_dt

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def create_booking(self, request):
        """Create booking with concurrency protection (lock + select_for_update)."""
        data = request.data
        service_id = data.get('serviceId') or data.get('service_id')
        barber_id = data.get('barberId') or data.get('barber_id')
        customer_id = data.get('customerId') or data.get('customer_id')
        booking_time_str = data.get('bookingTime') or data.get('booking_time')
        customer_notes = data.get('customerNotes') or data.get('customer_notes') or ''
        payment_status = data.get('paymentStatus') or data.get('payment_status') or 'Pending to be paid on cash'

        if not all([service_id, barber_id, customer_id, booking_time_str]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        barbershop = getattr(request, 'barbershop', None)
        try:
            service = get_object_or_404(Service, pk=service_id)
            if barbershop and service.barbershop and service.barbershop != barbershop:
                return Response({'error': 'Service does not belong to this barbershop'}, status=status.HTTP_403_FORBIDDEN)
            barber = get_object_or_404(User, pk=barber_id, role='Barber')
            customer = get_object_or_404(User, pk=customer_id, role='Customer')

            booking_time = datetime.fromisoformat(booking_time_str.replace('Z', '+00:00'))
            if timezone.is_naive(booking_time):
                booking_time = timezone.make_aware(booking_time)
            booking_date = booking_time.date()

            if booking_date < timezone.now().date():
                return Response({'error': 'Cannot book in the past'}, status=status.HTTP_400_BAD_REQUEST)

            service_duration = parse_duration(service.duration)
            if service_duration == 0:
                return Response({'error': 'Invalid service duration'}, status=status.HTTP_400_BAD_REQUEST)
            slot_end_time = booking_time + timedelta(minutes=service_duration)

            if barbershop and not self._slot_within_opening_hours(barbershop, booking_date, booking_time, slot_end_time):
                return Response({'error': 'Selected time is outside shop opening hours'}, status=status.HTTP_400_BAD_REQUEST)

            if Booking.objects.filter(customer=customer, barber=barber, slot__start_time=booking_time).exists():
                return Response({'error': 'You already have a booking with this barber at this time'}, status=status.HTTP_400_BAD_REQUEST)

            lock_key = f"booking_lock:{barber_id}:{booking_date}:{booking_time.isoformat()}"
            if not cache.add(lock_key, 'locked', timeout=30):
                return Response(
                    {'error': 'This slot was just booked by another user. Please refresh availability.'},
                    status=409,
                )
            try:
                with transaction.atomic():
                    slot = TimeSlot.objects.select_for_update().filter(
                        barber=barber,
                        date=booking_date,
                        start_time=booking_time,
                    ).first()
                    if not slot:
                        slot = TimeSlot.objects.create(
                            barber=barber,
                            barbershop=barbershop,
                            start_time=booking_time,
                            end_time=slot_end_time,
                            date=booking_date,
                            is_booked=False,
                        )
                        slot = TimeSlot.objects.select_for_update().get(pk=slot.pk)
                    if slot.is_booked:
                        return Response(
                            {'error': 'Slot no longer available'},
                            status=410,
                        )
                    booking = Booking.objects.create(
                        barbershop=barbershop,
                        customer=customer,
                        barber=barber,
                        service=service,
                        slot=slot,
                        booking_time=booking_time,
                        payment_status=payment_status,
                        booking_status='Confirmed',
                        customer_notes=customer_notes,
                    )
                    slot.is_booked = True
                    slot.save(update_fields=['is_booked'])
                    Notification.objects.create(
                        user=customer,
                        message=f'Your booking for {service.name} with the barber has been confirmed!',
                        notification_type='booking',
                        related_booking=booking,
                    )
                serializer = self.get_serializer(booking)
                # Push: notify barber and shop admins (after transaction commits)
                try:
                    from notifications.services import PushNotificationService
                    slot_time_str = booking_time.strftime('%H:%M') if hasattr(booking_time, 'strftime') else str(booking_time)
                    push_title = 'New Booking'
                    push_body = f'{customer.name} booked {service.name} for {booking_date} at {slot_time_str}'
                    push_data = {'type': 'booking_confirmation', 'booking_id': str(booking.id)}
                    PushNotificationService.notify_user(barber, push_title, push_body, push_data, category='booking_confirmation')
                    if barbershop:
                        PushNotificationService.notify_barbershop_staff(
                            barbershop, push_title, push_body, push_data, role_filter=['Admin']
                        )
                except Exception:
                    pass
                return Response({'booking': serializer.data}, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({'error': 'Double-booking prevented'}, status=409)
            finally:
                cache.delete(lock_key)
        except Exception as e:
            return Response({'error': 'Server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_bookings(self, request):
        """Get current user's bookings (customer/barber own, filtered by barbershop)."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'bookings': serializer.data,
            'total': queryset.count()
        })

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

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel a booking (customer own, barber/admin any)."""
        booking = get_object_or_404(Booking, pk=pk)
        user = request.user
        if user.role == 'Customer' and booking.customer_id != user.id:
            return Response({
                'success': False,
                'message': 'You can only cancel your own bookings'
            }, status=status.HTTP_403_FORBIDDEN)
        if booking.booking_status == 'Cancelled':
            return Response({
                'success': False,
                'message': 'Booking is already cancelled'
            }, status=status.HTTP_400_BAD_REQUEST)
        booking.booking_status = 'Cancelled'
        booking.save()
        Notification.objects.create(
            user=booking.customer,
            message=f'Your booking for {booking.service.name} has been cancelled.',
            notification_type='booking',
            related_booking=booking
        )
        serializer = self.get_serializer(booking)
        return Response({
            'success': True,
            'message': 'Booking cancelled successfully',
            'booking': serializer.data
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
