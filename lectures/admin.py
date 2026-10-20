"""Administration Django pour l'application lectures"""
from django.contrib import admin
from .models import SeanceLecture


@admin.register(SeanceLecture)
class SeanceLectureAdmin(admin.ModelAdmin):
    list_display = ('apprenant', 'enseignant', 'sourate', 'type_lecture', 'evaluation', 'date_seance')
    list_filter = ('type_lecture', 'evaluation', 'date_seance')
    search_fields = ('apprenant__nom', 'sourate')
    date_hierarchy = 'date_seance'
