# API Documentation — Association Coranique Omar Ibn Al-Khattab

**Base URL :** `http://localhost:8000`  
**Auth :** `Authorization: Bearer <access_token>` sur tous les endpoints sauf `/api/token/`

---

## Module 2 — Authentification JWT

### POST /api/token/
**Description** : Obtenir un token JWT  
**Auth** : Non requise  
**Body** :
```json
{ "email": "admin@association.tn", "password": "admin1234" }
```
**Réponse 200** :
```json
{ "access": "eyJ...", "refresh": "eyJ..." }
```
**Réponse 401** :
```json
{ "detail": "No active account found with the given credentials" }
```

---

### POST /api/token/refresh/
**Description** : Renouveler le token d'accès  
**Auth** : Non requise  
**Body** :
```json
{ "refresh": "eyJ..." }
```
**Réponse 200** :
```json
{ "access": "eyJ..." }
```

---

## Module 3 — Utilisateurs `/api/users/`

### GET /api/users/
**Description** : Liste tous les utilisateurs  
**Auth** : Admin uniquement  
**Réponse 200** :
```json
{
  "count": 6,
  "results": [
    { "id": 1, "email": "admin@association.tn", "nom": "Administrateur", "prenom": "Super", "role": "admin", "is_active": true }
  ]
}
```

---

### POST /api/users/
**Description** : Créer un utilisateur  
**Auth** : Admin  
**Body** :
```json
{
  "email": "user@example.com",
  "nom": "Ben Salah",
  "prenom": "Ali",
  "role": "apprenant",
  "centre": 1,
  "password": "motdepasse123"
}
```
**Réponse 201** :
```json
{ "id": 7, "email": "user@example.com", "role": "apprenant", "centre": 1 }
```
**Réponse 400** :
```json
{ "email": ["Un utilisateur avec cette adresse email existe déjà."] }
```

---

### GET /api/users/{id}/
**Description** : Détail d'un utilisateur  
**Auth** : Admin / Propriétaire  
**Réponse 200** :
```json
{ "id": 2, "email": "enseignant1@association.tn", "nom": "Ben Ali", "prenom": "Mohamed", "role": "enseignant", "centre": 1, "is_active": true }
```

---

### PUT /api/users/{id}/
**Description** : Modifier un utilisateur  
**Auth** : Admin  
**Body** : Mêmes champs que POST (sans password)  

---

### POST /api/users/{id}/desactiver/
**Description** : Désactiver un compte utilisateur  
**Auth** : Admin  
**Réponse 200** :
```json
{ "message": "Le compte de Mohamed Ben Ali (enseignant) a été désactivé." }
```

---

### POST /api/users/{id}/reinitialiser-mot-de-passe/
**Description** : Réinitialiser le mot de passe  
**Auth** : Admin  
**Body** :
```json
{ "new_password": "nouveaumotdepasse123" }
```
**Réponse 200** :
```json
{ "message": "Le mot de passe de Mohamed Ben Ali (enseignant) a été réinitialisé." }
```

---

## Module 4 — Centres `/api/centres/`

### GET /api/centres/
**Auth** : Tous les utilisateurs authentifiés  
**Réponse 200** :
```json
{
  "results": [
    { "id": 1, "nom": "Centre Principal", "ville": "Dar Chaabane El Fehri", "nombre_utilisateurs": 7 }
  ]
}
```

---

### POST /api/centres/
**Auth** : Admin  
**Body** :
```json
{ "nom": "Centre Kelibia", "adresse": "Rue Principale", "ville": "Kelibia", "telephone": "+216 72 111 000" }
```
**Réponse 201** :
```json
{ "id": 3, "nom": "Centre Kelibia", "ville": "Kelibia" }
```

---

### GET /api/centres/{id}/statistiques/
**Auth** : Tous  
**Réponse 200** :
```json
{
  "centre": "Centre Principal",
  "nombre_enseignants": 2,
  "nombre_apprenants": 10,
  "nombre_creneaux": 8,
  "nombre_seances": 45,
  "taux_presence": 87.5,
  "evaluation_moyenne": 3.8
}
```

---

### POST /api/centres/{id}/affecter-utilisateur/
**Auth** : Admin  
**Body** :
```json
{ "user_id": 5 }
```
**Réponse 200** :
```json
{ "message": "Omar Said (apprenant) a été affecté au centre Centre Kelibia." }
```
**Réponse 400** :
```json
{ "erreur": "Le champ 'user_id' est requis." }
```

---

## Module 5 — Programmes `/api/programmes/`

### GET /api/programmes/
**Filtres** : `?centre=1`, `?type_programme=collectif`, `?niveau=3`  
**Auth** : Tous  
**Réponse 200** :
```json
{
  "results": [
    { "id": 1, "nom": "Mémorisation - Juz 1", "type_programme": "collectif", "niveau": 1, "centre": 1 }
  ]
}
```

### POST /api/programmes/
**Auth** : Admin  
**Body** :
```json
{
  "nom": "Hifdh - Juz 5",
  "type_programme": "individuel",
  "niveau": 5,
  "centre": 1,
  "date_debut": "2025-09-01",
  "date_fin": "2026-06-30",
  "description": "Programme individuel de mémorisation du 5ème juz"
}
```

---

## Module 6 — Planning `/api/planning/`

### GET /api/planning/
**Filtres** : `?centre=1&date=2025-06-02&enseignant=2`  
**Auth** : Tous  
**Réponse 200** :
```json
{
  "results": [
    { "id": 1, "titre": "Cours Hifdh Lundi", "date": "2025-06-02", "heure_debut": "09:00:00", "heure_fin": "10:30:00", "enseignant": 2, "est_annule": false }
  ]
}
```

### POST /api/planning/
**Auth** : Admin / Enseignant  
**Body** :
```json
{
  "titre": "Cours Hifdh Lundi",
  "centre": 1,
  "enseignant": 2,
  "date": "2025-06-02",
  "heure_debut": "09:00:00",
  "heure_fin": "10:30:00",
  "est_annule": false
}
```
**Réponse 400 (conflit)** :
```json
{
  "conflit": "L'enseignant a déjà un créneau à cette heure.",
  "creneaux_en_conflit": [{ "id": 1, "titre": "Cours Hifdh Lundi" }]
}
```

### GET /api/planning/enseignant/{id}/
**Auth** : Tous  
**Réponse 200** : Liste des créneaux de l'enseignant

### GET /api/planning/apprenant/{id}/
**Auth** : Tous  
**Réponse 200** : Liste des créneaux du centre de l'apprenant

---

## Module 7 — Présences `/api/presences/`

### POST /api/presences/
**Auth** : Admin / Enseignant  
**Body** :
```json
{ "creneau": 1, "apprenant": 4, "statut": "present" }
```
Statuts : `present`, `absent`, `excuse`  
**Réponse 201** :
```json
{ "id": 3, "creneau": 1, "apprenant": 4, "statut": "present", "enregistre_par": 2 }
```
**Réponse 400 (doublon)** :
```json
{ "non_field_errors": ["Les champs creneau, apprenant doivent former un ensemble unique."] }
```

### GET /api/presences/?creneau=1
**Auth** : Tous  
**Réponse 200** : Liste des présences du créneau

### GET /api/presences/apprenant/{id}/historique/
**Auth** : Tous  
**Réponse 200** : Historique complet des présences

### GET /api/presences/apprenant/{id}/taux/
**Auth** : Tous  
**Réponse 200** :
```json
{
  "apprenant_id": 4,
  "total_seances": 20,
  "present": 16,
  "absent": 3,
  "excuse": 1,
  "taux_presence": 80.0,
  "alerte_absences": "3 absences consécutives détectées pour cet apprenant"
}
```
> `alerte_absences` vaut `null` si pas d'alerte, ou un message string si alerte déclenchée.

---

## Module 8 — Lectures `/api/lectures/`

### POST /api/lectures/
**Auth** : Admin / Enseignant  
**Body** :
```json
{
  "enseignant": 2,
  "apprenant": 4,
  "date_seance": "2025-06-02",
  "sourate": "Al-Baqara",
  "verset_debut": 1,
  "verset_fin": 30,
  "type_lecture": "hifdh",
  "evaluation": 4,
  "commentaire": "Bonne mémorisation",
  "duree_minutes": 45
}
```
Types : `hifdh`, `murajaa`, `tilawa` — Évaluation : `1` à `5`  
**Réponse 201** : Données de la séance créée  
**Réponse 400** :
```json
{ "non_field_errors": ["Le verset de fin doit être supérieur ou égal au verset de début."] }
```

### GET /api/lectures/apprenant/{id}/
**Auth** : Tous  
**Réponse 200** : Historique des séances de l'apprenant

### GET /api/lectures/enseignant/{id}/
**Auth** : Tous  
**Réponse 200** : Séances enregistrées par l'enseignant

---

## Module 9 — Progression `/api/statistiques/progression/`

### GET /api/statistiques/progression/apprenant/{id}/
**Auth** : Tous  
**Réponse 200** :
```json
{
  "apprenant_id": 4,
  "apprenant": "Ahmed Trabelsi (apprenant)",
  "juzaa_valides": 2,
  "juzaa_details": [
    { "sourate": "Al-Fatiha", "nb_seances": 3, "evaluation_moyenne": 4.33, "valide": true },
    { "sourate": "Al-Baqara", "nb_seances": 5, "evaluation_moyenne": 2.6, "valide": false }
  ],
  "progression_globale": 6.67
}
```
> Un juz est **validé** si évaluation moyenne ≥ 3.0

---

## Module 10 — Messagerie `/api/messagerie/`

### GET /api/messagerie/conversations/
**Auth** : Tous (uniquement ses propres conversations)  
**Réponse 200** :
```json
{
  "results": [
    {
      "id": 1,
      "participants": [2, 4],
      "participants_details": [{"id": 2, "nom": "Mohamed Ben Ali", "role": "enseignant"}],
      "date_creation": "2025-06-02T10:00:00",
      "non_lus_count": 2,
      "dernier_message": { "contenu": "Bonjour...", "date_envoi": "2025-06-02T10:05:00" }
    }
  ]
}
```

### POST /api/messagerie/conversations/
**Auth** : Tous  
**Body** :
```json
{ "participants": [2, 4] }
```

### GET /api/messagerie/conversations/{id}/messages/
**Auth** : Participant uniquement  
**Réponse 200** : Liste chronologique des messages

### POST /api/messagerie/conversations/{id}/messages/
**Auth** : Participant  
**Body** :
```json
{ "contenu": "Bonjour, avez-vous révisé la leçon ?" }
```
**Réponse 201** :
```json
{ "id": 5, "expediteur": 2, "contenu": "Bonjour...", "date_envoi": "2025-06-02T10:05:00", "lu": false }
```

### POST /api/messagerie/messages/{id}/lire/
**Auth** : Participant  
**Réponse 200** :
```json
{ "message": "Message marqué comme lu." }
```
**Réponse 403** :
```json
{ "erreur": "Vous n'êtes pas participant de cette conversation." }
```

---

## Module 11 — Statistiques `/api/statistiques/`

### GET /api/statistiques/global/
**Auth** : Admin  
**Réponse 200** :
```json
{
  "nombre_centres": 2,
  "nombre_enseignants": 5,
  "nombre_apprenants": 40,
  "nombre_seances_lecture": 200,
  "nombre_creneaux": 48,
  "creneaux_annules": 3
}
```

### GET /api/statistiques/centre/{id}/
**Auth** : Admin / Enseignant du centre  
**Réponse 200** :
```json
{
  "centre": "Centre Principal",
  "nombre_enseignants": 3,
  "nombre_apprenants": 25,
  "nombre_creneaux": 12,
  "nombre_seances": 80,
  "taux_presence": 85.0,
  "evaluation_moyenne": 3.8
}
```

### GET /api/statistiques/enseignant/{id}/
**Auth** : Auth  
**Réponse 200** :
```json
{ "enseignant": "Mohamed Ben Ali (enseignant)", "nombre_seances": 45, "apprenants_suivis": 12, "evaluation_moyenne": 3.9 }
```

### GET /api/statistiques/apprenant/{id}/
**Auth** : Tous (apprenant voit ses propres stats)  
**Réponse 200** :
```json
{ "apprenant": "Ahmed Trabelsi (apprenant)", "nombre_seances": 15, "taux_presence": 86.67, "evaluation_moyenne": 3.7 }
```

### GET /api/statistiques/export-excel/
**Auth** : Admin  
**Réponse 200** : Fichier `.xlsx` avec 3 feuilles :
- **Global** : Indicateurs généraux
- **Centres** : Liste avec nb_enseignants, nb_apprenants, taux_presence_moyen
- **Seances Lecture** : 100 dernières séances de lecture

### GET /api/statistiques/export-pdf/
**Auth** : Admin  
**Réponse 200** : Fichier `.pdf` (nécessite reportlab sur Python ≥ 3.11)  
**Réponse 503** (Python 3.15 alpha) :
```json
{ "erreur": "reportlab non disponible. Installez-le avec : pip install reportlab" }
```

---

## Codes d'erreur standard

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Données invalides / Conflit détecté |
| 401 | Token manquant ou expiré |
| 403 | Permission insuffisante |
| 404 | Ressource introuvable |
| 503 | Dépendance manquante (reportlab) |

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@association.tn` | `admin1234` |
| Enseignant | `enseignant1@association.tn` | `enseignant1234` |
| Apprenant | `apprenant1@association.tn` | `apprenant1234` |

---

## Commandes de démarrage

```bash
# Appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer les données de test
python setup_test_data.py

# Lancer le serveur
python manage.py runserver

# Test rapide (curl)
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@association.tn\",\"password\":\"admin1234\"}"
```
