"""
Modèle Programme pour la gestion des programmes d'enseignement coranique.
"""
from django.db import models


class Programme(models.Model):
    """Programme d'enseignement (collectif ou individuel)"""

    TYPE_CHOICES = (
        ('collectif', 'Collectif'),
        ('individuel', 'Individuel'),
    )

    # Choix pour les niveaux (Juz 1 à 30)
    NIVEAU_CHOICES = tuple((i, f'Juz {i}') for i in range(1, 31))

    nom = models.CharField('Nom du programme', max_length=200)
    type_programme = models.CharField('Type', max_length=20, choices=TYPE_CHOICES, default='collectif')
    niveau = models.IntegerField('Niveau (Juz)', choices=NIVEAU_CHOICES, default=1)
    centre = models.ForeignKey(
        'centres.Centre',
        on_delete=models.CASCADE,
        related_name='programmes',
        verbose_name='Centre'
    )
    date_debut = models.DateField('Date de début')
    date_fin = models.DateField('Date de fin', blank=True, null=True)
    description = models.TextField('Description', blank=True)

    class Meta:
        verbose_name = 'Programme'
        verbose_name_plural = 'Programmes'
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} - Juz {self.niveau}"
