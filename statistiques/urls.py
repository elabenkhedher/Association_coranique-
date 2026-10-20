"""URLs pour l'application statistiques (progression + statistiques)"""
from django.urls import path
from .progression import ProgressionApprenantView
from .views import (
    StatistiquesGlobalesView,
    StatistiquesCentreView,
    StatistiquesEnseignantView,
    StatistiquesApprenantView,
    ExportPDFView,
    ExportExcelView,
)

urlpatterns = [
    # Progression (Module 9)
    path('progression/apprenant/<int:apprenant_id>/', ProgressionApprenantView.as_view(), name='progression-apprenant'),

    # Statistiques globales (Module 11)
    path('global/', StatistiquesGlobalesView.as_view(), name='stats-global'),
    path('centre/<int:centre_id>/', StatistiquesCentreView.as_view(), name='stats-centre'),
    path('enseignant/<int:enseignant_id>/', StatistiquesEnseignantView.as_view(), name='stats-enseignant'),
    path('apprenant/<int:apprenant_id>/', StatistiquesApprenantView.as_view(), name='stats-apprenant'),
    path('export-pdf/', ExportPDFView.as_view(), name='export-pdf'),
    path('export-excel/', ExportExcelView.as_view(), name='export-excel'),
]
