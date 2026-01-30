"""Permission classes for barbershop-scoped access."""
from rest_framework.permissions import BasePermission

from .models import BarbershopStaff


class IsBarbershopOwner(BasePermission):
    """User must be the owner of the barbershop (request.barbershop.owner == request.user)."""
    message = 'You must be the owner of this barbershop.'

    def has_permission(self, request, view):
        barbershop = getattr(request, 'barbershop', None)
        if not barbershop:
            return False
        return barbershop.owner_id == request.user.id


class IsBarbershopAdmin(BasePermission):
    """User must be Admin or owner for this barbershop (BarbershopStaff role=Admin or owner)."""
    message = 'You must be an admin or owner of this barbershop.'

    def has_permission(self, request, view):
        barbershop = getattr(request, 'barbershop', None)
        if not barbershop:
            return False
        if barbershop.owner_id == request.user.id:
            return True
        staff = BarbershopStaff.objects.filter(
            barbershop=barbershop,
            user=request.user,
            is_active=True,
            role='Admin',
        ).exists()
        return staff
