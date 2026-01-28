from django.contrib import admin
from .models import Barbershop, BarbershopStaff


@admin.register(Barbershop)
class BarbershopAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'city', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'city', 'owner__email']
    raw_id_fields = ['owner']


@admin.register(BarbershopStaff)
class BarbershopStaffAdmin(admin.ModelAdmin):
    list_display = ['user', 'barbershop', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'joined_at']
    search_fields = ['user__name', 'barbershop__name']
    raw_id_fields = ['barbershop', 'user']
