"""
Multi-tenant middleware to handle barbershop/tenant context.
Automatically sets tenant from header, subdomain, or user's default barbershop.
"""
from django.utils.deprecation import MiddlewareMixin
from django.shortcuts import get_object_or_404
from .models import Barbershop, BarbershopStaff
import logging

logger = logging.getLogger(__name__)


class BarbershopContextMiddleware(MiddlewareMixin):
    """
    Middleware to set barbershop context from request.
    Priority:
    1. X-Barbershop-Id header
    2. Subdomain (if configured)
    3. User's default barbershop (if authenticated)
    """
    
    def process_request(self, request):
        request.barbershop = None
        request.barbershop_id = None
        
        # Priority 1: Get from header
        barbershop_id = request.headers.get('X-Barbershop-Id')
        if barbershop_id:
            try:
                barbershop_id = int(barbershop_id)
                barbershop = Barbershop.objects.filter(id=barbershop_id, is_active=True).first()
                if barbershop:
                    request.barbershop = barbershop
                    request.barbershop_id = barbershop_id
                    return
            except (ValueError, TypeError):
                pass
        
        # Priority 2: Get from subdomain (if configured)
        host = request.get_host()
        if '.' in host:
            subdomain = host.split('.')[0]
            if subdomain and subdomain not in ['www', 'api', 'admin']:
                try:
                    barbershop = Barbershop.objects.filter(
                        name__iexact=subdomain.replace('-', ' '),
                        is_active=True
                    ).first()
                    if barbershop:
                        request.barbershop = barbershop
                        request.barbershop_id = barbershop.id
                        return
                except Exception as e:
                    logger.warning(f"Subdomain barbershop lookup error: {str(e)}")
        
        # Priority 3: Get from user's default barbershop (if authenticated)
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                # Get user's first active barbershop affiliation
                staff_member = BarbershopStaff.objects.filter(
                    user=request.user,
                    is_active=True
                ).select_related('barbershop').first()
                
                if staff_member and staff_member.barbershop.is_active:
                    request.barbershop = staff_member.barbershop
                    request.barbershop_id = staff_member.barbershop.id
                    return
                
                # If user owns a barbershop
                owned_barbershop = Barbershop.objects.filter(
                    owner=request.user,
                    is_active=True
                ).first()
                
                if owned_barbershop:
                    request.barbershop = owned_barbershop
                    request.barbershop_id = owned_barbershop.id
            except Exception as e:
                logger.warning(f"User barbershop lookup error: {str(e)}")
