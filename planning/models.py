"""
Modèle Creneau pour la gestion du planning des cours.
"""
from django.db import models


class Creneau(models.Model):
    """Créneau horaire dans le planning d'un centre"""

    titre = models.CharField('Titre', max_length=200)
    centre = models.ForeignKey(
        'centres.Centre',
        on_delete=models.CASCADE,
        related_name='creneaux',
        verbose_name='Centre'
    )
    enseignant = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='creneaux_enseignant',
        verbose_name='Enseignant',
        limit_choices_to={'role': 'enseignant'}
    )
    date = models.DateField('Date')
    heure_debut = models.TimeField('Heure de début')
    heure_fin = models.TimeField('Heure de fin')
    programme = models.ForeignKey(
        'programmes.Programme',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='creneaux',
        verbose_name='Programme'
    )
    est_annule = models.BooleanField('Est annulé', default=False)

    class Meta:
        verbose_name = 'Créneau'
        verbose_name_plural = 'Créneaux'
        ordering = ['date', 'heure_debut']

    def __str__(self):
        return f"{self.titre} - {self.date} ({self.heure_debut}-{self.heure_fin})"
