"""
Modèle Centre pour la gestion des différents centres de l'association.
"""
from django.db import models


class Centre(models.Model):
    """Centre d'enseignement coranique"""

    nom = models.CharField('Nom du centre', max_length=200)
    adresse = models.TextField('Adresse', blank=True)
    ville = models.CharField('Ville', max_length=100, default='Dar Chaabane El Fehri')
    telephone = models.CharField('Téléphone', max_length=20, blank=True, null=True)
    date_creation = models.DateField('Date de création', auto_now_add=True)
    responsable = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='centres_responsable',
        verbose_name='Responsable'
    )

    class Meta:
        verbose_name = 'Centre'
        verbose_name_plural = 'Centres'
        ordering = ['nom']

    def __str__(self):
        return self.nom
