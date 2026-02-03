"""
URL configuration for barbershop management system.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def root_view(request):
    """Root URL: point users to the API."""
    return JsonResponse({
        "message": "Barbershop Management System API",
        "docs": "/api/docs/",
        "admin": "/admin/",
    })


urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    path('api/barbershops/', include('barbershops.urls')),
    path('api/reviews/', include('barbershops.review_urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/customers/', include('accounts.urls')),
    path('api/barbers/', include('accounts.urls')),
    path('api/service/', include('services.urls')),
    path('api/product/', include('services.product_urls')),
    path('api/booking/', include('bookings.urls')),
    path('api/order/', include('services.order_urls')),
    path('api/payments/', include('payments.standalone_urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Add API documentation routes if drf_spectacular is installed
try:
    from drf_spectacular.views import (
        SpectacularAPIView,
        SpectacularRedocView,
        SpectacularSwaggerView,
    )
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]
except ImportError:
    pass

# Serve static files in development (DEBUG=True) so admin CSS/JS load without Nginx
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
