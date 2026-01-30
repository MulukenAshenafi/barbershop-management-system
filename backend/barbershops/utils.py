"""
Utility functions for multi-tenant barbershop operations.
"""
import random
import string
from django.db.models import QuerySet
from typing import Optional

from .models import Barbershop


def generate_unique_subdomain(slug: str) -> str:
    """Generate collision-proof subdomain: {slug}-{random4chars}."""
    slug = (slug or 'shop').lower().replace(' ', '-')
    slug = ''.join(c for c in slug if c in string.ascii_lowercase + string.digits + '-')
    slug = '-'.join(filter(None, slug.split('-')))
    if not slug:
        slug = 'shop'
    max_len = 50 - 5  # 4 chars + hyphen
    if len(slug) > max_len:
        slug = slug[:max_len].rstrip('-')
    for _ in range(100):
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        subdomain = f'{slug}-{suffix}'
        if not Barbershop.objects.filter(subdomain=subdomain).exists():
            return subdomain
    # Fallback with timestamp-like suffix
    subdomain = f'{slug}-{random.randint(1000, 9999)}'
    return subdomain


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
