from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, create_barber, get_all_barbers

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    
    # Customer routes (matching original API structure)
    path('signup', UserViewSet.as_view({'post': 'signup'}), name='customer-signup'),
    path('login', UserViewSet.as_view({'post': 'login'}), name='customer-login'),
    path('profile', UserViewSet.as_view({'get': 'profile'}), name='customer-profile'),
    path('update-profile', UserViewSet.as_view({'put': 'update_profile'}), name='customer-update-profile'),
    path('set-preferences', UserViewSet.as_view({'post': 'set_preferences'}), name='customer-set-preferences'),
    path('set-specialization', UserViewSet.as_view({'post': 'set_specialization'}), name='barber-set-specialization'),
    
    # Barber routes
    path('barbers/signup', create_barber, name='barber-signup'),
    path('barbers/get-all', get_all_barbers, name='barber-list'),
]
