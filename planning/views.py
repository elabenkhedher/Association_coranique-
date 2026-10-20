"""
Views pour l'application planning.
CRUD des créneaux + détection de conflits horaires + planning par enseignant/apprenant.
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Creneau
from .serializers import CreneauSerializer
from users.permissions import EstAdmin, EstAdminOuEnseignant, PermissionParRole


class CreneauViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des créneaux.
    - CRUD complet
    - GET /api/planning/?centre=X&date=Y : filtrer par centre et date
    - GET /api/planning/enseignant/{id}/ : planning d'un enseignant
    - GET /api/planning/apprenant/{id}/ : planning d'un apprenant
    """
    queryset = Creneau.objects.select_related('centre', 'enseignant', 'programme')
    serializer_class = CreneauSerializer
    filterset_fields = ['centre', 'date', 'enseignant', 'est_annule']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [EstAdminOuEnseignant()]
        return [PermissionParRole()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Creneau.objects.select_related('centre', 'enseignant', 'programme').all()
        elif user.role == 'enseignant':
            return Creneau.objects.select_related(
                'centre', 'enseignant', 'programme'
            ).filter(centre=user.centre)
        else:
            # Apprenant : voit les créneaux de son centre
            if user.centre:
                return Creneau.objects.select_related(
                    'centre', 'enseignant', 'programme'
                ).filter(centre=user.centre)
            return Creneau.objects.none()

    def perform_create(self, serializer):
        """Vérifie les conflits horaires avant la création"""
        data = serializer.validated_data
        conflits = Creneau.objects.filter(
            enseignant=data['enseignant'],
            date=data['date'],
            est_annule=False,
        ).filter(
            heure_debut__lt=data['heure_fin'],
            heure_fin__gt=data['heure_debut'],
        )

        if conflits.exists():
            raise serializers.ValidationError({
                'conflit': "L'enseignant a déjà un créneau à cette heure.",
                'creneaux_en_conflit': CreneauSerializer(conflits, many=True).data
            })

        serializer.save()

    def perform_update(self, serializer):
        """Vérifie les conflits horaires avant la modification"""
        data = serializer.validated_data
        instance = self.get_object()

        conflits = Creneau.objects.filter(
            enseignant=data.get('enseignant', instance.enseignant),
            date=data.get('date', instance.date),
            est_annule=False,
        ).filter(
            heure_debut__lt=data.get('heure_fin', instance.heure_fin),
            heure_fin__gt=data.get('heure_debut', instance.heure_debut),
        ).exclude(pk=instance.pk)

        if conflits.exists():
            raise serializers.ValidationError({
                'conflit': "L'enseignant a déjà un créneau à cette heure.",
                'creneaux_en_conflit': CreneauSerializer(conflits, many=True).data
            })

        serializer.save()

    @action(detail=False, methods=['get'], url_path='enseignant/(?P<enseignant_id>[^/.]+)')
    def planning_enseignant(self, request, enseignant_id=None):
        """Retourne le planning d'un enseignant"""
        creneaux = self.get_queryset().filter(enseignant_id=enseignant_id)
        serializer = self.get_serializer(creneaux, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='apprenant/(?P<apprenant_id>[^/.]+)')
    def planning_apprenant(self, request, apprenant_id=None):
        """Retourne le planning d'un apprenant (via les créneaux de son centre)"""
        from users.models import CustomUser
        try:
            apprenant = CustomUser.objects.get(pk=apprenant_id, role='apprenant')
        except CustomUser.DoesNotExist:
            return Response(
                {'erreur': 'Apprenant introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        creneaux = self.get_queryset().filter(centre=apprenant.centre)
        serializer = self.get_serializer(creneaux, many=True)
        return Response(serializer.data)
