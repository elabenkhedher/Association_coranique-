"""URLs pour l'application presences"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PresenceViewSet

router = DefaultRouter()
router.register(r'', PresenceViewSet, basename='presences')

urlpatterns = [
    path('', include(router.urls)),
]
