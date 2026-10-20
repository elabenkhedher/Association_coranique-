"""
Views pour l'application programmes.
CRUD avec filtrage par centre, type et niveau.
"""
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from .models import Programme
from .serializers import ProgrammeSerializer
from users.permissions import EstAdmin, PermissionParRole


class ProgrammeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des programmes.
    - CRUD complet
    - Filtrage par centre, type_programme, niveau
    """
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer
    filterset_fields = ['centre', 'type_programme', 'niveau']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [EstAdmin()]
        return [PermissionParRole()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Programme.objects.all()
        elif user.role in ('enseignant', 'apprenant'):
            if user.centre:
                return Programme.objects.filter(centre=user.centre)
            return Programme.objects.none()
        return Programme.objects.none()
