"""
Multi-tenant middleware to handle barbershop/tenant context.
Automatically sets tenant from header, subdomain, or user's default barbershop.
If barbershop.subscription_status == 'suspended', returns 403 "Subscription expired".
"""
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
from .models import Barbershop, BarbershopStaff
import logging
import json

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
                    if barbershop.subscription_status == 'suspended':
                        return HttpResponse(
                            json.dumps({'detail': 'Subscription expired'}),
                            status=403,
                            content_type='application/json',
                        )
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
                        if barbershop.subscription_status == 'suspended':
                            return HttpResponse(
                                json.dumps({'detail': 'Subscription expired'}),
                                status=403,
                                content_type='application/json',
                            )
                        request.barbershop = barbershop
                        request.barbershop_id = barbershop.id
                        return
                except Exception as e:
                    logger.warning(f"Subdomain barbershop lookup error: {str(e)}")
        
        # Priority 3: If X-Barbershop-Id missing and user is authenticated,
        # check BarbershopStaff: if exactly 1 active affiliation, auto-set context;
        # if multiple, leave None (force explicit selection).
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                staff_shop_ids = list(
                    BarbershopStaff.objects.filter(
                        user=request.user,
                        is_active=True,
                        barbershop__is_active=True,
                    ).values_list('barbershop_id', flat=True)
                )
                owned_shop_ids = list(
                    Barbershop.objects.filter(
                        owner=request.user,
                        is_active=True,
                    ).values_list('id', flat=True)
                )
                all_shop_ids = list(dict.fromkeys(staff_shop_ids + owned_shop_ids))
                if len(all_shop_ids) == 1:
                    barbershop = Barbershop.objects.filter(
                        id=all_shop_ids[0],
                        is_active=True,
                    ).first()
                    if barbershop:
                        if barbershop.subscription_status == 'suspended':
                            pass  # leave barbershop None so view can handle
                        else:
                            request.barbershop = barbershop
                            request.barbershop_id = barbershop.id
            except Exception as e:
                logger.warning("User barbershop lookup error: %s", e)
