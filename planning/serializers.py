"""Serializers pour l'application planning"""
from rest_framework import serializers
from .models import Creneau


class CreneauSerializer(serializers.ModelSerializer):
    """Serializer complet pour le modèle Creneau"""
    centre_nom = serializers.CharField(source='centre.nom', read_only=True)
    enseignant_nom = serializers.CharField(source='enseignant.__str__', read_only=True)
    programme_nom = serializers.CharField(source='programme.nom', read_only=True, default=None)

    class Meta:
        model = Creneau
        fields = [
            'id', 'titre', 'centre', 'centre_nom',
            'enseignant', 'enseignant_nom', 'date',
            'heure_debut', 'heure_fin', 'programme', 'programme_nom',
            'est_annule'
        ]
        read_only_fields = ['id']

    def validate(self, data):
        """Vérifie que l'heure de fin est après l'heure de début"""
        if data.get('heure_debut') and data.get('heure_fin'):
            if data['heure_fin'] <= data['heure_debut']:
                raise serializers.ValidationError(
                    "L'heure de fin doit être après l'heure de début."
                )
        return data
