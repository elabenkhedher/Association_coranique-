"""Serializers pour l'application messagerie"""
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Message"""
    expediteur_nom = serializers.CharField(source='expediteur.__str__', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'expediteur', 'expediteur_nom',
            'contenu', 'date_envoi', 'lu'
        ]
        read_only_fields = ['id', 'date_envoi', 'expediteur', 'conversation']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Conversation"""
    dernier_message = MessageSerializer(read_only=True)
    non_lus_count = serializers.SerializerMethodField()
    participants_details = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'participants_details',
            'date_creation', 'dernier_message', 'non_lus_count'
        ]
        read_only_fields = ['id', 'date_creation']

    def get_non_lus_count(self, obj):
        """Nombre de messages non lus pour l'utilisateur connecté"""
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(lu=False).exclude(
                expediteur=request.user
            ).count()
        return 0

    def get_participants_details(self, obj):
        """Retourne les noms des participants"""
        return [
            {'id': p.id, 'nom': f"{p.prenom} {p.nom}", 'role': p.role}
            for p in obj.participants.all()
        ]
