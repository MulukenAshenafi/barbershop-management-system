from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Check if user is Admin."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'


class IsBarberUser(permissions.BasePermission):
    """Check if user is Barber."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Barber'


class IsCustomerUser(permissions.BasePermission):
    """Check if user is Customer."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Customer'
