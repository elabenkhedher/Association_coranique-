"""Administration Django pour l'application centres"""
from django.contrib import admin
from .models import Centre


@admin.register(Centre)
class CentreAdmin(admin.ModelAdmin):
    list_display = ('nom', 'ville', 'telephone', 'responsable', 'date_creation')
    list_filter = ('ville',)
    search_fields = ('nom', 'ville')
