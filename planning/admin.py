"""Administration Django pour l'application planning"""
from django.contrib import admin
from .models import Creneau


@admin.register(Creneau)
class CreneauAdmin(admin.ModelAdmin):
    list_display = ('titre', 'centre', 'enseignant', 'date', 'heure_debut', 'heure_fin', 'est_annule')
    list_filter = ('centre', 'enseignant', 'date', 'est_annule')
    search_fields = ('titre',)
    date_hierarchy = 'date'
