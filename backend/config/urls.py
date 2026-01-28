"""
URL configuration for barbershop management system.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/auth/', include('accounts.urls')),
    path('api/customers/', include('accounts.urls')),
    path('api/barbers/', include('accounts.urls')),
    path('api/service/', include('services.urls')),  # Service routes
    path('api/product/', include('services.product_urls')),  # Product routes
    path('api/booking/', include('bookings.urls')),  # Booking routes
    path('api/order/', include('services.order_urls')),  # Order routes
    path('api/payments/', include('payments.standalone_urls')),  # Payment routes (standalone)
    path('api/notifications/', include('notifications.urls')),  # Notification routes
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
