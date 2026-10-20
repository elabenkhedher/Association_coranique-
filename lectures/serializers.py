"""Serializers pour l'application lectures"""
from rest_framework import serializers
from .models import SeanceLecture


class SeanceLectureSerializer(serializers.ModelSerializer):
    """Serializer complet pour le modèle SeanceLecture"""
    enseignant_nom = serializers.CharField(source='enseignant.__str__', read_only=True)
    apprenant_nom = serializers.CharField(source='apprenant.__str__', read_only=True)

    class Meta:
        model = SeanceLecture
        fields = [
            'id', 'enseignant', 'enseignant_nom', 'apprenant', 'apprenant_nom',
            'date_seance', 'sourate', 'verset_debut', 'verset_fin',
            'type_lecture', 'evaluation', 'commentaire', 'duree_minutes'
        ]
        read_only_fields = ['id']

    def validate(self, data):
        """Vérifie que le verset de fin est >= au verset de début"""
        if data.get('verset_debut') and data.get('verset_fin'):
            if data['verset_fin'] < data['verset_debut']:
                raise serializers.ValidationError(
                    "Le verset de fin doit être supérieur ou égal au verset de début."
                )
        return data
