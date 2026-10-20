"""
Permissions personnalisées pour le contrôle d'accès par rôle.
- Admin : accès complet
- Enseignant : accès aux données de son centre
- Apprenant : accès uniquement à ses propres données
"""
from rest_framework.permissions import BasePermission


class EstAdmin(BasePermission):
    """Autorise uniquement les administrateurs"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class EstAdminOuEnseignant(BasePermission):
    """Autorise les administrateurs et les enseignants"""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ('admin', 'enseignant')
        )


class EstProprietaireOuAdmin(BasePermission):
    """
    Autorise l'admin ou le propriétaire de l'objet.
    L'objet doit avoir un champ identifiant l'utilisateur (configuré via owner_field).
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        # Vérifie si l'utilisateur est le propriétaire
        owner_field = getattr(view, 'owner_field', None)
        if owner_field:
            return getattr(obj, owner_field) == request.user
        return obj == request.user


class PermissionParRole(BasePermission):
    """
    Permission dynamique basée sur le rôle de l'utilisateur :
    - Admin : accès complet
    - Enseignant : accès aux données de son centre
    - Apprenant : accès à ses propres données uniquement
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin : accès total
        if user.role == 'admin':
            return True

        # Enseignant : accès aux objets de son centre
        if user.role == 'enseignant':
            if hasattr(obj, 'centre') and obj.centre == user.centre:
                return True
            if hasattr(obj, 'enseignant') and obj.enseignant == user:
                return True
            if hasattr(obj, 'participants') and user in obj.participants.all():
                return True
            return False

        # Apprenant : accès uniquement à ses propres données
        if user.role == 'apprenant':
            if hasattr(obj, 'apprenant') and obj.apprenant == user:
                return True
            if hasattr(obj, 'participants') and user in obj.participants.all():
                return True
            return obj == user

        return False
