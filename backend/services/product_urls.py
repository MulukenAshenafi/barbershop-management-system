from django.urls import path
from .views import ProductViewSet

urlpatterns = [
    path('get-all', ProductViewSet.as_view({'get': 'get_all'}), name='get-all-products'),
    path('top', ProductViewSet.as_view({'get': 'top'}), name='get-top-products'),
    path('<int:pk>', ProductViewSet.as_view({'get': 'retrieve'}), name='get-single-product'),
    path('create', ProductViewSet.as_view({'post': 'create'}), name='create-product'),
    path('update/<int:pk>', ProductViewSet.as_view({'put': 'update'}), name='update-product'),
    path('image/<int:pk>', ProductViewSet.as_view({'put': 'update_image'}), name='update-product-image'),
    path('delete-image/<int:pk>', ProductViewSet.as_view({'delete': 'delete_image'}), name='delete-product-image'),
    path('delete/<int:pk>', ProductViewSet.as_view({'delete': 'destroy'}), name='delete-product'),
    path('<int:pk>/review', ProductViewSet.as_view({'put': 'review'}), name='product-review'),
]
