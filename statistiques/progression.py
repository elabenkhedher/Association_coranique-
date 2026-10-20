"""
Views pour l'application statistiques.
Calcul de la progression depuis les séances de lecture.
Un juz est "validé" si l'évaluation moyenne >= 3 sur ce juz.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg

from lectures.models import SeanceLecture
from presences.models import Presence
from users.models import CustomUser

# Correspondance entre les sourates et les juzaa (simplifié - début de chaque juz)
# On utilise ici le numéro de juz stocké dans les programmes et déduit par la sourate
# Pour ce backend, on se base sur un champ 'niveau' libre à configurer
JUZ_SOURATES = {
    1: "Al-Fatiha / Al-Baqara",
    2: "Al-Baqara (2:142-252)",
    3: "Al-Baqara (2:253) / Al-Imran (3:1-91)",
    4: "Al-Imran (3:92) / An-Nisa (4:23)",
    5: "An-Nisa (4:24-147)",
    6: "An-Nisa (4:148) / Al-Maidah",
    7: "Al-Maidah / Al-An'am",
    8: "Al-An'am / Al-A'raf",
    9: "Al-A'raf / Al-Anfal",
    10: "Al-Anfal / At-Tawbah",
    # ... les 30 juzaa
}


class ProgressionApprenantView(APIView):
    """
    GET /api/progression/apprenant/{id}/
    Calcul automatique de la progression d'un apprenant.

    Un juz est "validé" si l'évaluation moyenne des séances de ce juz >= 3.
    On se base sur le programme associé à l'enseignant (niveau = numéro de juz).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, apprenant_id):
        # Vérifier que l'utilisateur a le droit d'accéder
        user = request.user
        if user.role == 'apprenant' and user.id != int(apprenant_id):
            return Response(
                {'erreur': "Accès refusé."},
                status=403
            )

        try:
            apprenant = CustomUser.objects.get(pk=apprenant_id, role='apprenant')
        except CustomUser.DoesNotExist:
            return Response({'erreur': "Apprenant introuvable."}, status=404)

        # Récupérer toutes les séances de lecture de l'apprenant
        seances = SeanceLecture.objects.filter(apprenant=apprenant)

        if not seances.exists():
            return Response({
                'apprenant_id': int(apprenant_id),
                'apprenant': str(apprenant),
                'juzaa_valides': 0,
                'juzaa_details': [],
                'progression_globale': 0.0,
            })

        # Grouper les séances par sourate (proxy pour le juz)
        # On groupe par la sourate et on calcule la moyenne
        sourates_stats = {}
        for seance in seances:
            sourate = seance.sourate
            if sourate not in sourates_stats:
                sourates_stats[sourate] = {'evaluations': [], 'seances': 0}
            sourates_stats[sourate]['evaluations'].append(seance.evaluation)
            sourates_stats[sourate]['seances'] += 1

        # Calculer les détails par sourate
        details = []
        juzaa_valides = 0

        for sourate, stats in sourates_stats.items():
            evaluations = stats['evaluations']
            moyenne = sum(evaluations) / len(evaluations)
            valide = moyenne >= 3.0

            if valide:
                juzaa_valides += 1

            details.append({
                'sourate': sourate,
                'nb_seances': stats['seances'],
                'evaluation_moyenne': round(moyenne, 2),
                'valide': valide,
            })

        # Trier par validité puis par sourate
        details.sort(key=lambda x: (not x['valide'], x['sourate']))

        # Progression globale sur 30 juzaa (max)
        progression_globale = min(juzaa_valides / 30 * 100, 100)

        return Response({
            'apprenant_id': int(apprenant_id),
            'apprenant': str(apprenant),
            'juzaa_valides': juzaa_valides,
            'juzaa_details': details,
            'progression_globale': round(progression_globale, 2),
        })
