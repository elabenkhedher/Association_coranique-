"""
Views pour l'application presences.
Enregistrement de présences, historique, taux de présence, alertes.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Presence
from .serializers import PresenceSerializer
from users.permissions import EstAdminOuEnseignant, PermissionParRole


class PresenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des présences.
    - POST /api/presences/ : enregistrer présence/absence
    - GET /api/presences/?creneau=X : présences d'un créneau
    - GET /api/presences/apprenant/{id}/historique/ : historique d'un apprenant
    - GET /api/presences/apprenant/{id}/taux/ : taux de présence
    """
    queryset = Presence.objects.select_related('creneau', 'apprenant', 'enregistre_par')
    serializer_class = PresenceSerializer
    filterset_fields = ['creneau', 'apprenant', 'statut']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [EstAdminOuEnseignant()]
        return [PermissionParRole()]

    def create(self, request, *args, **kwargs):
        """
        Enregistre la présence. Si une entrée existe déjà pour le couple 
        (créneau, apprenant), elle est mise à jour au lieu de créer un doublon.
        """
        # On gère soit un objet unique, soit une liste facultative
        donnees = request.data
        if not isinstance(donnees, list):
            donnees = [donnees]
            
        resultats = []
        for d in donnees:
            presence, created = Presence.objects.update_or_create(
                creneau_id=d.get('creneau'),
                apprenant_id=d.get('apprenant'),
                defaults={
                    'statut': d.get('statut'),
                    'enregistre_par': request.user
                }
            )
            resultats.append(PresenceSerializer(presence).data)
            
        return Response(resultats, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Presence.objects.select_related('creneau', 'apprenant').all()
        elif user.role == 'enseignant':
            return Presence.objects.select_related('creneau', 'apprenant').filter(
                creneau__centre=user.centre
            )
        else:
            return Presence.objects.select_related('creneau', 'apprenant').filter(
                apprenant=user
            )

    @action(detail=False, methods=['get'], url_path='apprenant/(?P<apprenant_id>[^/.]+)/historique')
    def historique_apprenant(self, request, apprenant_id=None):
        """Historique des présences d'un apprenant"""
        presences = self.get_queryset().filter(apprenant_id=apprenant_id)
        serializer = self.get_serializer(presences, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='apprenant/(?P<apprenant_id>[^/.]+)/taux')
    def taux_presence(self, request, apprenant_id=None):
        """Calcul du taux de présence d'un apprenant"""
        presences = Presence.objects.filter(apprenant_id=apprenant_id)
        total = presences.count()

        if total == 0:
            return Response({
                'apprenant_id': apprenant_id,
                'total_seances': 0,
                'taux_presence': 0,
                'alerte_absences': False,
            })

        nb_present = presences.filter(statut='present').count()
        nb_absent = presences.filter(statut='absent').count()
        nb_excuse = presences.filter(statut='excuse').count()
        taux = (nb_present / total) * 100

        # Vérification des 3 absences consécutives
        alerte = self._verifier_absences_consecutives(apprenant_id)

        return Response({
            'apprenant_id': int(apprenant_id),
            'total_seances': total,
            'present': nb_present,
            'absent': nb_absent,
            'excuse': nb_excuse,
            'taux_presence': round(taux, 2),
            'alerte_absences': alerte,
        })

    def _verifier_absences_consecutives(self, apprenant_id, seuil=3):
        """
        Vérifie si un apprenant a été absent consécutivement (seuil fois).
        Retourne un message string si alerte, None sinon.
        Les présences sont ordonnées du plus récent au plus ancien.
        """
        presences = list(
            Presence.objects.filter(
                apprenant_id=apprenant_id
            ).order_by('-creneau__date', '-creneau__heure_debut')[:seuil]
        )

        # Il faut exactement `seuil` présences et toutes absentes
        if len(presences) == seuil and all(p.statut == 'absent' for p in presences):
            return f"{seuil} absences consécutives détectées pour cet apprenant"
        return None

