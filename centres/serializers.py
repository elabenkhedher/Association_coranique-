"""Serializers pour l'application centres"""
from rest_framework import serializers
from .models import Centre


class CentreSerializer(serializers.ModelSerializer):
    """Serializer complet pour le modèle Centre"""
    responsable_nom = serializers.CharField(
        source='responsable.__str__', read_only=True, default=None
    )
    nombre_utilisateurs = serializers.SerializerMethodField()

    class Meta:
        model = Centre
        fields = [
            'id', 'nom', 'adresse', 'ville', 'telephone',
            'date_creation', 'responsable', 'responsable_nom',
            'nombre_utilisateurs'
        ]
        read_only_fields = ['id', 'date_creation']

    def get_nombre_utilisateurs(self, obj):
        """Retourne le nombre d'utilisateurs rattachés au centre"""
        return obj.utilisateurs.count()
