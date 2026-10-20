"""Administration Django pour l'application presences"""
from django.contrib import admin
from .models import Presence


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ('apprenant', 'creneau', 'statut', 'enregistre_par', 'date_enregistrement')
    list_filter = ('statut', 'date_enregistrement')
    search_fields = ('apprenant__nom', 'apprenant__prenom')
