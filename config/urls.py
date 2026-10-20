"""
Configuration principale des URLs du projet.
Association Coranique Omar Ibn Al-Khattab
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.serializers import MyTokenObtainPairView

urlpatterns = [
    # Administration Django
    path('admin/', admin.site.urls),

    # === Module 2 : Authentification JWT ===
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # === Module 3 : API Utilisateurs ===
    path('api/users/', include('users.urls')),

    # === Module 4 : API Centres ===
    path('api/centres/', include('centres.urls')),

    # === Module 5 : API Programmes ===
    path('api/programmes/', include('programmes.urls')),

    # === Module 6 : API Planning ===
    path('api/planning/', include('planning.urls')),

    # === Module 7 : API Présences ===
    path('api/presences/', include('presences.urls')),

    # === Module 8 : API Lectures ===
    path('api/lectures/', include('lectures.urls')),

    # === Module 9 + 11 : Progression & Statistiques ===
    path('api/statistiques/', include('statistiques.urls')),

    # === Module 10 : API Messagerie ===
    path('api/messagerie/', include('messagerie.urls')),
]
