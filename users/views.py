"""
Views pour l'application users.
Gestion des utilisateurs : CRUD, désactivation, réinitialisation de mot de passe.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CustomUser
from .serializers import UserSerializer, UserCreateSerializer, ChangePasswordSerializer
from .permissions import EstAdmin, EstAdminOuEnseignant, PermissionParRole


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des utilisateurs.
    - GET /api/users/ : liste (admin uniquement)
    - POST /api/users/ : créer un utilisateur (admin)
    - GET /api/users/{id}/ : détail
    - PUT /api/users/{id}/ : modifier
    - POST /api/users/{id}/desactiver/ : désactiver le compte
    - POST /api/users/{id}/reinitialiser-mot-de-passe/ : réinitialiser le mot de passe
    """
    queryset = CustomUser.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('list', 'create'):
            return [EstAdminOuEnseignant()]
        return [PermissionParRole()]

    def get_queryset(self):
        """Filtre les utilisateurs selon le rôle et les paramètres"""
        user = self.request.user
        if user.role == 'admin':
            queryset = CustomUser.objects.all()
        elif user.role == 'enseignant':
            queryset = CustomUser.objects.filter(centre=user.centre)
        else:
            queryset = CustomUser.objects.filter(pk=user.pk)

        # Filtre par rôle si présent dans la requête
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            
        return queryset

    @action(detail=True, methods=['post'], url_path='desactiver')
    def desactiver(self, request, pk=None):
        """Désactiver un compte utilisateur"""
        utilisateur = self.get_object()
        utilisateur.is_active = False
        utilisateur.save()
        return Response(
            {'message': f"Le compte de {utilisateur} a été désactivé."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='reinitialiser-mot-de-passe')
    def reinitialiser_mot_de_passe(self, request, pk=None):
        """Réinitialiser le mot de passe d'un utilisateur"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        utilisateur = self.get_object()
        utilisateur.set_password(serializer.validated_data['new_password'])
        utilisateur.save()
        return Response(
            {'message': f"Le mot de passe de {utilisateur} a été réinitialisé."},
            status=status.HTTP_200_OK
        )
