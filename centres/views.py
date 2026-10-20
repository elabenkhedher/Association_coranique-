"""
Views pour l'application centres.
CRUD + statistiques + affectation d'utilisateurs.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count

from .models import Centre
from .serializers import CentreSerializer
from users.models import CustomUser
from users.permissions import EstAdmin, PermissionParRole


class CentreViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des centres.
    - CRUD complet
    - GET /api/centres/{id}/statistiques/ : stats du centre
    - POST /api/centres/{id}/affecter-utilisateur/ : affecter un utilisateur au centre
    """
    queryset = Centre.objects.all()
    serializer_class = CentreSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [EstAdmin()]
        return [PermissionParRole()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Centre.objects.all()
        elif user.role in ('enseignant', 'apprenant'):
            if user.centre:
                return Centre.objects.filter(pk=user.centre.pk)
            return Centre.objects.none()
        return Centre.objects.none()

    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'un centre"""
        centre = self.get_object()

        # Comptage des utilisateurs par rôle
        enseignants = CustomUser.objects.filter(centre=centre, role='enseignant').count()
        apprenants = CustomUser.objects.filter(centre=centre, role='apprenant').count()

        # Nombre de programmes
        nb_programmes = centre.programmes.count()

        # Nombre de créneaux
        nb_creneaux = centre.creneaux.count()

        # Taux de présence moyen
        from presences.models import Presence
        total_presences = Presence.objects.filter(creneau__centre=centre).count()
        presences_present = Presence.objects.filter(
            creneau__centre=centre, statut='present'
        ).count()
        taux_presence = (presences_present / total_presences * 100) if total_presences > 0 else 0

        return Response({
            'centre': centre.nom,
            'nombre_enseignants': enseignants,
            'nombre_apprenants': apprenants,
            'nombre_programmes': nb_programmes,
            'nombre_creneaux': nb_creneaux,
            'taux_presence': round(taux_presence, 2),
        })

    @action(detail=True, methods=['post'], url_path='affecter-utilisateur')
    def affecter_utilisateur(self, request, pk=None):
        """Affecter un utilisateur (enseignant ou apprenant) à un centre"""
        centre = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {'erreur': "Le champ 'user_id' est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            utilisateur = CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {'erreur': "Utilisateur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        if utilisateur.role == 'admin':
            return Response(
                {'erreur': "Impossible d'affecter un administrateur à un centre."},
                status=status.HTTP_400_BAD_REQUEST
            )

        utilisateur.centre = centre
        utilisateur.save()
        return Response(
            {'message': f"{utilisateur} a été affecté au centre {centre.nom}."},
            status=status.HTTP_200_OK
        )
