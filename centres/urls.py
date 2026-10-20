"""URLs pour l'application centres"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CentreViewSet

router = DefaultRouter()
router.register(r'', CentreViewSet, basename='centres')

urlpatterns = [
    path('', include(router.urls)),
]
