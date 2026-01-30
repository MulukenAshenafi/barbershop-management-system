"""URLs for /api/reviews/ (create, update, delete)."""
from django.urls import path
from . import review_views

urlpatterns = [
    path('', review_views.review_create),
    path('<int:pk>/', review_views.review_detail),
]
