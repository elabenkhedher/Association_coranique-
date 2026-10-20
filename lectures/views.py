"""
Views pour l'application lectures.
Enregistrement et consultation des séances de lecture coranique.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SeanceLecture
from .serializers import SeanceLectureSerializer
from users.permissions import EstAdminOuEnseignant, PermissionParRole


class SeanceLectureViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des séances de lecture.
    - POST /api/lectures/ : enregistrer une séance
    - GET /api/lectures/apprenant/{id}/ : historique d'un apprenant
    - GET /api/lectures/enseignant/{id}/ : séances d'un enseignant
    """
    queryset = SeanceLecture.objects.select_related('enseignant', 'apprenant')
    serializer_class = SeanceLectureSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [EstAdminOuEnseignant()]
        return [PermissionParRole()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return SeanceLecture.objects.select_related('enseignant', 'apprenant').all()
        elif user.role == 'enseignant':
            return SeanceLecture.objects.select_related(
                'enseignant', 'apprenant'
            ).filter(enseignant=user)
        else:
            return SeanceLecture.objects.select_related(
                'enseignant', 'apprenant'
            ).filter(apprenant=user)

    @action(detail=False, methods=['get'], url_path='apprenant/(?P<apprenant_id>[^/.]+)')
    def par_apprenant(self, request, apprenant_id=None):
        """Historique des séances de lecture d'un apprenant"""
        seances = self.get_queryset().filter(apprenant_id=apprenant_id)
        serializer = self.get_serializer(seances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='enseignant/(?P<enseignant_id>[^/.]+)')
    def par_enseignant(self, request, enseignant_id=None):
        """Séances enregistrées par un enseignant"""
        seances = self.get_queryset().filter(enseignant_id=enseignant_id)
        serializer = self.get_serializer(seances, many=True)
        return Response(serializer.data)
