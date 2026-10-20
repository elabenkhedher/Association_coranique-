"""
Modèle utilisateur personnalisé pour l'application.
Utilise l'email comme identifiant de connexion au lieu du username.

CORRIGÉ : Ajout du champ date_creation (auto_now_add=True).
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    """Manager personnalisé pour utiliser l'email comme identifiant"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    """Modèle utilisateur personnalisé avec rôles et rattachement à un centre"""

    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('enseignant', 'Enseignant'),
        ('apprenant', 'Apprenant'),
    )

    # Désactivation du champ username — on utilise l'email
    username = None
    email = models.EmailField('Adresse email', unique=True)
    nom = models.CharField('Nom', max_length=100)
    prenom = models.CharField('Prénom', max_length=100)
    role = models.CharField('Rôle', max_length=20, choices=ROLE_CHOICES, default='apprenant')
    telephone = models.CharField('Téléphone', max_length=20, blank=True, null=True)
    date_naissance = models.DateField('Date de naissance', blank=True, null=True)
    # date_creation : distinct de date_joined (hérité d'AbstractUser), utilisé dans l'API
    date_creation = models.DateTimeField('Date de création du compte', auto_now_add=True)
    centre = models.ForeignKey(
        'centres.Centre',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='utilisateurs',
        verbose_name='Centre'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"
