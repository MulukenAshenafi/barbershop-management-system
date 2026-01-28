from django.urls import path
from .views import ServiceViewSet

# Service routes (matching original API: /api/service/)
urlpatterns = [
    path('get-all', ServiceViewSet.as_view({'get': 'get_all'}), name='get-all-services'),
    path('<int:pk>', ServiceViewSet.as_view({'get': 'get_single'}), name='get-single-service'),
    path('create', ServiceViewSet.as_view({'post': 'create'}), name='create-service'),
    path('update/<int:pk>', ServiceViewSet.as_view({'put': 'update'}), name='update-service'),
    path('image/<int:pk>', ServiceViewSet.as_view({'put': 'update_image'}), name='update-service-image'),
    path('delete-image/<int:pk>', ServiceViewSet.as_view({'delete': 'delete_image'}), name='delete-service-image'),
    path('delete/<int:pk>', ServiceViewSet.as_view({'delete': 'destroy'}), name='delete-service'),
]
