from rest_framework import serializers
from .models import Booking, TimeSlot
from services.models import Service
from accounts.models import User


class TimeSlotSerializer(serializers.ModelSerializer):
    """Time slot serializer."""
    
    class Meta:
        model = TimeSlot
        fields = ['id', 'start_time', 'end_time', 'is_booked', 'date']
        read_only_fields = ['id']


class BookingSerializer(serializers.ModelSerializer):
    """Booking serializer."""
    customerId = serializers.PrimaryKeyRelatedField(source='customer', queryset=User.objects.filter(role='Customer'), read_only=False)
    barberId = serializers.PrimaryKeyRelatedField(source='barber', queryset=User.objects.filter(role='Barber'), read_only=False)
    serviceId = serializers.PrimaryKeyRelatedField(source='service', queryset=Service.objects.all(), read_only=False)
    slotId = serializers.PrimaryKeyRelatedField(source='slot', queryset=TimeSlot.objects.all(), read_only=False, required=False)
    bookingTime = serializers.DateTimeField(source='booking_time')
    paymentStatus = serializers.CharField(source='payment_status')
    paymentIntentId = serializers.CharField(source='payment_intent_id', required=False, allow_blank=True)
    bookingStatus = serializers.CharField(source='booking_status')
    customerNotes = serializers.CharField(source='customer_notes', required=False, allow_blank=True)
    
    class Meta:
        model = Booking
        fields = [
            'customerId', 'barberId', 'serviceId', 'slotId',
            'bookingTime', 'paymentStatus', 'paymentIntentId',
            'bookingStatus', 'customerNotes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        if instance.customer:
            data['customerId'] = {
                '_id': str(instance.customer.id),
                'name': instance.customer.name,
                'email': instance.customer.email
            }
        if instance.barber:
            data['barberId'] = {
                '_id': str(instance.barber.id),
                'name': instance.barber.name,
                'email': instance.barber.email
            }
        if instance.service:
            data['serviceId'] = {
                '_id': str(instance.service.id),
                'name': instance.service.name,
                'duration': instance.service.duration
            }
        if instance.slot:
            data['slotId'] = {
                '_id': str(instance.slot.id),
                'startTime': instance.slot.start_time.isoformat(),
                'endTime': instance.slot.end_time.isoformat()
            }
        if instance.barbershop_id:
            data['barbershopId'] = instance.barbershop_id
            data['barbershop'] = {'id': instance.barbershop_id, 'name': getattr(instance.barbershop, 'name', '')}
        return data
