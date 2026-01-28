from django.urls import path
from .views import OrderViewSet
from payments.views import order_payment

urlpatterns = [
    path('create', OrderViewSet.as_view({'post': 'create'}), name='create-order'),
    path('my-orders', OrderViewSet.as_view({'get': 'my_orders'}), name='my-orders'),
    path('my-orders/<int:pk>', OrderViewSet.as_view({'get': 'get_single'}), name='get-single-order'),
    path('payments', order_payment, name='order-payment'),  # Order payment endpoint
    path('admin/get-all-orders', OrderViewSet.as_view({'get': 'admin_get_all_orders'}), name='admin-get-all-orders'),
    path('admin/order/<int:pk>', OrderViewSet.as_view({'put': 'admin_change_status'}), name='admin-change-order-status'),
]
