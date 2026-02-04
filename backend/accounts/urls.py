from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, create_barber, get_all_barbers,
    register, verify_email, password_reset, password_reset_confirm,
    change_email, change_email_confirm, guest_login,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    # Django-native auth (JWT)
    path('register/', register, name='auth-register'),
    path('verify-email/<str:token>/', verify_email, name='auth-verify-email'),
    path('password-reset/', password_reset, name='auth-password-reset'),
    path('password-reset/confirm/', password_reset_confirm, name='auth-password-reset-confirm'),
    path('change-email/', change_email, name='auth-change-email'),
    path('change-email/confirm/', change_email_confirm, name='auth-change-email-confirm'),
    path('guest-login/', guest_login, name='auth-guest-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    # Customer routes (matching original API structure)
    path('signup', UserViewSet.as_view({'post': 'signup'}), name='customer-signup'),
    path('login/', UserViewSet.as_view({'post': 'login'}), name='customer-login'),
    path('profile', UserViewSet.as_view({'get': 'profile'}), name='customer-profile'),
    path('update-profile', UserViewSet.as_view({'put': 'update_profile'}), name='customer-update-profile'),
    path('set-preferences', UserViewSet.as_view({'post': 'set_preferences'}), name='customer-set-preferences'),
    path('set-specialization', UserViewSet.as_view({'post': 'set_specialization'}), name='barber-set-specialization'),
    path('social/google/', UserViewSet.as_view({'post': 'google_login'}), name='google-login'),
    # Barber routes
    path('barbers/signup', create_barber, name='barber-signup'),
    path('barbers/get-all', get_all_barbers, name='barber-list'),
]
