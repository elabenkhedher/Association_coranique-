"""Serializers pour l'application users"""
from rest_framework import serializers
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour la lecture des données utilisateur"""
    centre_nom = serializers.CharField(source='centre.nom', read_only=True, default=None)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'nom', 'prenom', 'role',
            'telephone', 'date_naissance', 'centre', 'centre_nom',
            'is_active', 'date_creation', 'date_joined'
        ]
        read_only_fields = ['id', 'date_creation', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'un utilisateur (avec mot de passe)"""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'nom', 'prenom', 'role',
            'telephone', 'date_naissance', 'centre', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # On peut ajouter des claims personnalisés dans le token si besoin
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # On peut aussi récupérer l'utilisateur via attrs['email'] si self.user est absent
        user = self.user
        data['user_id'] = user.id
        data['role'] = user.role
        data['email'] = user.email
        data['nom'] = user.nom
        data['prenom'] = user.prenom
        print(f"PIPELINE DEBUG: Sending data: {data}")
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour le changement de mot de passe"""
    new_password = serializers.CharField(min_length=8)
