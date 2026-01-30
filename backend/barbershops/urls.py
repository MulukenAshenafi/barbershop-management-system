"""URL configuration for barbershop registration, my-shops, invite, public, staff."""
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.barbershop_register),
    path('my-shops/', views.my_shops),
    path('check-name/', views.check_name),
    path('invite/', views.invite_staff),
    path('invite/accept/', views.accept_invite),
    path('public/', views.public_list),
    path('nearby/', views.nearby),
    path('<int:pk>/public/', views.public_detail),
    path('<int:pk>/reviews/', views.barbershop_reviews_list),
    path('<int:pk>/rating-summary/', views.barbershop_rating_summary),
    path('<int:pk>/staff/', views.BarbershopStaffListView.as_view()),
    path('staff/<int:pk>/', views.BarbershopStaffDetailView.as_view()),
    path('<int:pk>/', views.BarbershopDetailView.as_view()),
]
