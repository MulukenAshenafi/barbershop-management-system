from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['uuid', 'email', 'name', 'role', 'phone_number', 'phone', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'name', 'phone', 'phone_number', 'firebase_uid']
    ordering = ['-date_joined']
    readonly_fields = ['uuid', 'date_joined', 'updated_at']

    fieldsets = (
        (None, {'fields': ('uuid', 'email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone', 'phone_number', 'location', 'profile_pic_url', 'profile_pic_public_id')}),
        ('Role & Permissions', {'fields': ('role', 'preferences', 'specialization', 'is_active', 'is_staff', 'is_superuser')}),
        ('Firebase', {'fields': ('firebase_uid', 'firebase_provider')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'phone', 'password1', 'password2', 'role'),
        }),
    )
