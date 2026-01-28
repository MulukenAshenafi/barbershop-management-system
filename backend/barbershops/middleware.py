"""
Middleware to handle barbershop/tenant context.
This can be extended to automatically set tenant from subdomain or header.
"""
from django.utils.deprecation import MiddlewareMixin


class BarbershopContextMiddleware(MiddlewareMixin):
    """
    Middleware to set barbershop context from request.
    Can be extended to read from subdomain, header, or user's default barbershop.
    """
    
    def process_request(self, request):
        # Placeholder for tenant context
        # In production, this could read from:
        # - Subdomain (e.g., shop1.example.com)
        # - Header (X-Barbershop-Id)
        # - User's default barbershop
        request.barbershop_id = None
        
        # Example: Get from header if present
        barbershop_id = request.headers.get('X-Barbershop-Id')
        if barbershop_id:
            try:
                request.barbershop_id = int(barbershop_id)
            except (ValueError, TypeError):
                pass
        
        # Example: Get from user's default barbershop if authenticated
        if request.user.is_authenticated and not request.barbershop_id:
            # Could set default barbershop from user's first affiliation
            pass
