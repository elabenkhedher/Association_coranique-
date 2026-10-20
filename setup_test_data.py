"""Script de création du superutil et des utilisateurs de test avec mots de passe."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser
from centres.models import Centre

# Créer le superuser admin si absent
if not CustomUser.objects.filter(email='admin@association.tn').exists():
    admin = CustomUser.objects.create_superuser(
        email='admin@association.tn',
        password='admin1234',
        nom='Administrateur',
        prenom='Super',
        role='admin',
    )
    print("✅ Admin créé : admin@association.tn / admin1234")
else:
    print("ℹ️  Admin déjà existant.")

# Créer les centres si absents
centre1, _ = Centre.objects.get_or_create(
    nom="Centre Omar Ibn Al-Khattab - Principal",
    defaults={'ville': 'Dar Chaabane El Fehri', 'telephone': '+216 72 000 001'}
)
centre2, _ = Centre.objects.get_or_create(
    nom="Centre Omar Ibn Al-Khattab - Annexe",
    defaults={'ville': 'Dar Chaabane El Fehri', 'telephone': '+216 72 000 002'}
)
print(f"✅ Centres : {centre1.nom}, {centre2.nom}")

# Enseignant 1
if not CustomUser.objects.filter(email='enseignant1@association.tn').exists():
    CustomUser.objects.create_user(
        email='enseignant1@association.tn',
        password='enseignant1234',
        nom='Ben Ali',
        prenom='Mohamed',
        role='enseignant',
        centre=centre1
    )
    print("✅ Enseignant créé : enseignant1@association.tn / enseignant1234")

# Enseignant 2
if not CustomUser.objects.filter(email='enseignant2@association.tn').exists():
    CustomUser.objects.create_user(
        email='enseignant2@association.tn',
        password='enseignant1234',
        nom='Gharbi',
        prenom='Fatma',
        role='enseignant',
        centre=centre2
    )
    print("✅ Enseignante créée : enseignant2@association.tn / enseignant1234")

# Apprenants
for i, (prenom, nom) in enumerate([('Ahmed', 'Trabelsi'), ('Mariam', 'Keskes'), ('Youssef', 'Mansouri')], 1):
    email = f'apprenant{i}@association.tn'
    if not CustomUser.objects.filter(email=email).exists():
        centre = centre1 if i <= 2 else centre2
        CustomUser.objects.create_user(
            email=email,
            password='apprenant1234',
            nom=nom,
            prenom=prenom,
            role='apprenant',
            centre=centre
        )
        print(f"✅ Apprenant créé : {email} / apprenant1234")

print("\n🎉 Données de test créées avec succès !")
print("📋 Comptes :")
print("   Admin     : admin@association.tn / admin1234")
print("   Enseignant: enseignant1@association.tn / enseignant1234")
print("   Apprenant : apprenant1@association.tn / apprenant1234")
