"""
Caching utilities for services app.
"""
from django.core.cache import cache
from functools import wraps
from typing import Callable, Any
import hashlib
import json


def cache_key_generator(*args, **kwargs) -> str:
    """Generate cache key from function arguments."""
    key_parts = []
    
    # Add args
    for arg in args:
        if hasattr(arg, 'id'):
            key_parts.append(str(arg.id))
        else:
            key_parts.append(str(arg))
    
    # Add kwargs
    for k, v in sorted(kwargs.items()):
        if hasattr(v, 'id'):
            key_parts.append(f"{k}:{v.id}")
        else:
            key_parts.append(f"{k}:{v}")
    
    key_string = "_".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached_view(timeout: int = 300, key_prefix: str = ''):
    """
    Decorator to cache view responses.
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
        key_prefix: Prefix for cache key
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            request = args[0] if args else None
            barbershop_id = getattr(request, 'barbershop_id', None) if request else None
            
            cache_key = f"{key_prefix}_{func.__name__}"
            if barbershop_id:
                cache_key += f"_shop_{barbershop_id}"
            
            # Add function arguments to cache key
            key_suffix = cache_key_generator(*args[1:], **kwargs)
            cache_key = f"{cache_key}_{key_suffix}"
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                return cached_response
            
            # Call function and cache result
            response = func(*args, **kwargs)
            cache.set(cache_key, response, timeout)
            
            return response
        
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """
    Invalidate all cache keys matching a pattern.
    
    Args:
        pattern: Cache key pattern to match
    """
    try:
        from django_redis import get_redis_connection
        redis_client = get_redis_connection("default")
        # Use Redis SCAN to find matching keys
        cursor = 0
        while True:
            cursor, keys = redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                redis_client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        # Fallback: clear all cache if Redis pattern matching fails
        cache.clear()
