from django.contrib import admin
from .models import Booking, TimeSlot


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['barber', 'date', 'start_time', 'end_time', 'is_booked']
    list_filter = ['date', 'is_booked', 'created_at']
    search_fields = ['barber__name']
    raw_id_fields = ['barber', 'barbershop']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'barber', 'service', 'booking_time', 'payment_status', 'booking_status']
    list_filter = ['payment_status', 'booking_status', 'created_at']
    search_fields = ['customer__name', 'barber__name', 'service__name']
    raw_id_fields = ['customer', 'barber', 'service', 'slot', 'barbershop']
    readonly_fields = ['created_at', 'updated_at']
