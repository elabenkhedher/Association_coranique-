"""
Modèle SeanceLecture pour le suivi des séances de lecture coranique.

CORRIGÉ : verset_debut, verset_fin et duree_minutes passés en PositiveIntegerField
          (semantiquement correct — ne peut pas être négatif).
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class SeanceLecture(models.Model):
    """Séance de lecture coranique entre un enseignant et un apprenant"""

    TYPE_LECTURE_CHOICES = (
        ('hifdh', 'Hifdh (Mémorisation)'),
        ('murajaa', 'Murajaa (Révision)'),
        ('tilawa', 'Tilawa (Récitation)'),
    )

    enseignant = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='seances_enseignant',
        verbose_name='Enseignant',
        limit_choices_to={'role': 'enseignant'}
    )
    apprenant = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='seances_apprenant',
        verbose_name='Apprenant',
        limit_choices_to={'role': 'apprenant'}
    )
    date_seance = models.DateField('Date de la séance')
    sourate = models.CharField('Sourate', max_length=100)
    # PositiveIntegerField garantit >= 1 sans validateur supplémentaire
    verset_debut = models.PositiveIntegerField('Verset début')
    verset_fin = models.PositiveIntegerField('Verset fin')
    type_lecture = models.CharField(
        'Type de lecture',
        max_length=20,
        choices=TYPE_LECTURE_CHOICES
    )
    evaluation = models.IntegerField(
        'Évaluation',
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Note de 1 à 5'
    )
    commentaire = models.TextField('Commentaire', blank=True, null=True)
    duree_minutes = models.PositiveIntegerField(
        'Durée (minutes)',
        default=30
    )

    class Meta:
        verbose_name = 'Séance de lecture'
        verbose_name_plural = 'Séances de lecture'
        ordering = ['-date_seance']

    def __str__(self):
        return f"{self.apprenant} - {self.sourate} ({self.type_lecture}) - {self.date_seance}"
