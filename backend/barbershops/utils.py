"""
Utility functions for multi-tenant barbershop operations.
"""
from django.db.models import QuerySet
from typing import Optional


def filter_by_barbershop(queryset: QuerySet, barbershop_id: Optional[int] = None) -> QuerySet:
    """
    Filter queryset by barbershop (tenant isolation).
    
    Args:
        queryset: Django queryset to filter
        barbershop_id: Barbershop ID (if None, returns all - use with caution)
        
    Returns:
        Filtered queryset
    """
    if barbershop_id is None:
        # Return all (use with caution in multi-tenant scenarios)
        return queryset
    
    # Filter by barbershop if model has barbershop field
    if hasattr(queryset.model, 'barbershop'):
        return queryset.filter(barbershop_id=barbershop_id)
    
    return queryset


def get_barbershop_from_request(request) -> Optional[int]:
    """
    Get barbershop ID from request context.
    
    Args:
        request: Django request object
        
    Returns:
        Barbershop ID or None
    """
    if hasattr(request, 'barbershop_id'):
        return request.barbershop_id
    return None
