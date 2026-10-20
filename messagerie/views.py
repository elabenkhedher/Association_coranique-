"""
Views pour l'application messagerie.
Gestion des conversations et messages internes.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from users.permissions import PermissionParRole


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des conversations.
    - GET /api/messagerie/conversations/ : liste des conversations de l'utilisateur connecté
    - POST /api/messagerie/conversations/ : créer une conversation
    - GET /api/messagerie/conversations/{id}/messages/ : historique des messages
    - POST /api/messagerie/conversations/{id}/messages/ : envoyer un message
    """
    serializer_class = ConversationSerializer
    permission_classes = [PermissionParRole]

    def get_queryset(self):
        """Retourne uniquement les conversations de l'utilisateur connecté"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')

    def perform_create(self, serializer):
        """Crée la conversation et ajoute automatiquement l'expéditeur comme participant"""
        conversation = serializer.save()
        # Ajouter l'utilisateur connecté s'il n'est pas déjà dans les participants
        if self.request.user not in conversation.participants.all():
            conversation.participants.add(self.request.user)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        """Liste et envoi de messages dans une conversation"""
        conversation = self.get_object()

        if request.method == 'GET':
            messages = conversation.messages.select_related('expediteur').order_by('date_envoi')
            serializer = MessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = MessageSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save(
                conversation=conversation,
                expediteur=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.GenericViewSet):
    """
    ViewSet pour les actions sur les messages individuels.
    - POST /api/messagerie/messages/{id}/lire/ : marquer un message comme lu
    """
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [PermissionParRole]

    @action(detail=True, methods=['post'])
    def lire(self, request, pk=None):
        """Marquer un message comme lu"""
        message = self.get_object()

        # Vérifier que l'utilisateur est participant de la conversation
        if request.user not in message.conversation.participants.all():
            return Response(
                {'erreur': "Vous n'êtes pas participant de cette conversation."},
                status=status.HTTP_403_FORBIDDEN
            )

        message.lu = True
        message.save()
        return Response({'message': 'Message marqué comme lu.'}, status=status.HTTP_200_OK)
