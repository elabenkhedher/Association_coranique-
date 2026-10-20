"""Administration Django pour l'application messagerie"""
from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'date_creation')
    filter_horizontal = ('participants',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'expediteur', 'date_envoi', 'lu')
    list_filter = ('lu', 'date_envoi')
