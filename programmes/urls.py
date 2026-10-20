"""URLs pour l'application programmes"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgrammeViewSet

router = DefaultRouter()
router.register(r'', ProgrammeViewSet, basename='programmes')

urlpatterns = [
    path('', include(router.urls)),
]
