from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OneTimeToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['uuid', 'email', 'name', 'role', 'phone_number', 'phone', 'is_active', 'email_verified', 'is_guest', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'email_verified', 'is_guest', 'date_joined']
    search_fields = ['email', 'name', 'phone', 'phone_number', 'firebase_uid', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['uuid', 'date_joined', 'updated_at']

    fieldsets = (
        (None, {'fields': ('uuid', 'email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'name', 'phone', 'phone_number', 'location', 'profile_pic_url', 'profile_pic_public_id')}),
        ('Role & Permissions', {'fields': ('role', 'preferences', 'specialization', 'is_active', 'is_staff', 'is_superuser', 'email_verified', 'is_guest')}),
        ('Firebase', {'fields': ('firebase_uid', 'firebase_provider')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'name', 'phone', 'password1', 'password2', 'role'),
        }),
    )


@admin.register(OneTimeToken)
class OneTimeTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'purpose', 'created_at', 'expires_at']
    list_filter = ['purpose']
    search_fields = ['token', 'user__email']
    readonly_fields = ['token', 'created_at']
