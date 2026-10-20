"""Administration Django pour l'application users"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Configuration de l'admin pour le modèle CustomUser"""
    model = CustomUser
    list_display = ('email', 'nom', 'prenom', 'role', 'centre', 'is_active')
    list_filter = ('role', 'is_active', 'centre')
    search_fields = ('email', 'nom', 'prenom')
    ordering = ('nom', 'prenom')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('nom', 'prenom', 'telephone', 'date_naissance')}),
        ('Affectation', {'fields': ('role', 'centre')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nom', 'prenom', 'role', 'password1', 'password2'),
        }),
    )
