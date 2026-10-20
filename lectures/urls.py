"""URLs pour l'application lectures"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeanceLectureViewSet

router = DefaultRouter()
router.register(r'', SeanceLectureViewSet, basename='lectures')

urlpatterns = [
    path('', include(router.urls)),
]
