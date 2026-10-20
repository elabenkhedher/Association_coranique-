"""
Modèles Conversation et Message pour la messagerie interne.
"""
from django.db import models


class Conversation(models.Model):
    """Conversation entre plusieurs utilisateurs"""

    participants = models.ManyToManyField(
        'users.CustomUser',
        related_name='conversations',
        verbose_name='Participants'
    )
    date_creation = models.DateTimeField('Date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-date_creation']

    def __str__(self):
        return f"Conversation #{self.pk}"

    @property
    def dernier_message(self):
        """Retourne le dernier message de la conversation"""
        return self.messages.order_by('-date_envoi').first()


class Message(models.Model):
    """Message envoyé dans une conversation"""

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Conversation'
    )
    expediteur = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='messages_envoyes',
        verbose_name='Expéditeur'
    )
    contenu = models.TextField('Contenu')
    date_envoi = models.DateTimeField('Date d\'envoi', auto_now_add=True)
    lu = models.BooleanField('Lu', default=False)

    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['date_envoi']

    def __str__(self):
        return f"Message de {self.expediteur} - {self.date_envoi}"
