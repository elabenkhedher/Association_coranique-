"""Serializers pour l'application programmes"""
from rest_framework import serializers
from .models import Programme


class ProgrammeSerializer(serializers.ModelSerializer):
    """Serializer complet pour le modèle Programme"""
    centre_nom = serializers.CharField(source='centre.nom', read_only=True)

    class Meta:
        model = Programme
        fields = [
            'id', 'nom', 'type_programme', 'niveau',
            'centre', 'centre_nom', 'date_debut', 'date_fin', 'description'
        ]
        read_only_fields = ['id']
