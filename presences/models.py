"""
Modèle Presence pour le suivi des présences des apprenants.
"""
from django.db import models


class Presence(models.Model):
    """Enregistrement de présence/absence d'un apprenant pour un créneau"""

    STATUT_CHOICES = (
        ('present', 'Présent'),
        ('absent', 'Absent'),
        ('excuse', 'Excusé'),
    )

    creneau = models.ForeignKey(
        'planning.Creneau',
        on_delete=models.CASCADE,
        related_name='presences',
        verbose_name='Créneau'
    )
    apprenant = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='presences',
        verbose_name='Apprenant',
        limit_choices_to={'role': 'apprenant'}
    )
    statut = models.CharField('Statut', max_length=10, choices=STATUT_CHOICES, default='present')
    enregistre_par = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='presences_enregistrees',
        verbose_name='Enregistré par'
    )
    date_enregistrement = models.DateTimeField('Date d\'enregistrement', auto_now_add=True)

    class Meta:
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
        ordering = ['-date_enregistrement']
        # Un apprenant ne peut avoir qu'une seule présence par créneau
        unique_together = ['creneau', 'apprenant']

    def __str__(self):
        return f"{self.apprenant} - {self.creneau} : {self.statut}"
