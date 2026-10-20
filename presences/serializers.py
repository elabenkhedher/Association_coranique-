"""Serializers pour l'application presences"""
from rest_framework import serializers
from .models import Presence


class PresenceSerializer(serializers.ModelSerializer):
    """Serializer complet pour le modèle Presence"""
    apprenant_nom = serializers.CharField(source='apprenant.__str__', read_only=True)
    creneau_titre = serializers.CharField(source='creneau.titre', read_only=True)

    class Meta:
        model = Presence
        fields = [
            'id', 'creneau', 'creneau_titre', 'apprenant', 'apprenant_nom',
            'statut', 'enregistre_par', 'date_enregistrement'
        ]
        read_only_fields = ['id', 'date_enregistrement', 'enregistre_par']

    def create(self, validated_data):
        """Enregistre automatiquement l'utilisateur connecté comme enregistreur"""
        validated_data['enregistre_par'] = self.context['request'].user
        return super().create(validated_data)
