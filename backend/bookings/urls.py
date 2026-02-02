from django.urls import path, include
from .views import BookingViewSet

urlpatterns = [
    path('create', BookingViewSet.as_view({'post': 'create_booking'}), name='create-booking'),  # /api/booking/create
    path('my-bookings', BookingViewSet.as_view({'get': 'my_bookings'}), name='my-bookings'),  # customer list
    path('availability', BookingViewSet.as_view({'get': 'availability'}), name='check-availability'),  # /api/booking/availability
    path('cancel/<int:pk>', BookingViewSet.as_view({'patch': 'cancel'}), name='cancel-booking'),
    path('payments', include('payments.urls')),  # /api/booking/payments -> payments app
    path('notifications', include('notifications.urls')),  # /api/booking/notifications -> notifications app
    path('get-all', BookingViewSet.as_view({'get': 'get_all'}), name='get-all-bookings'),  # /api/booking/get-all
    path('approve/<int:pk>', BookingViewSet.as_view({'patch': 'approve'}), name='approve-booking'),  # /api/booking/approve/<id>
]
