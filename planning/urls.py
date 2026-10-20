"""URLs pour l'application planning"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreneauViewSet

router = DefaultRouter()
router.register(r'', CreneauViewSet, basename='planning')

urlpatterns = [
    path('', include(router.urls)),
]
