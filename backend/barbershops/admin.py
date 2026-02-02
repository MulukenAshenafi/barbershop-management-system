from django.contrib import admin
from .models import Barbershop, BarbershopStaff, Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'barbershop', 'customer', 'rating', 'is_approved', 'is_verified', 'created_at']
    list_filter = ['is_approved', 'is_verified', 'rating', 'created_at']
    search_fields = ['customer__name', 'barbershop__name', 'comment']
    raw_id_fields = ['barbershop', 'customer', 'barber', 'booking', 'order']
    list_editable = ['is_approved']
    actions = ['bulk_approve', 'bulk_hide']

    @admin.action(description='Approve selected reviews')
    def bulk_approve(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description='Hide selected reviews')
    def bulk_hide(self, request, queryset):
        queryset.update(is_approved=False)


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
