"""Administration Django pour l'application programmes"""
from django.contrib import admin
from .models import Programme


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'type_programme', 'niveau', 'centre', 'date_debut', 'date_fin')
    list_filter = ('type_programme', 'niveau', 'centre')
    search_fields = ('nom',)
