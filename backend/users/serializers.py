from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirmer mot de passe")

    class Meta:
        model  = User
        fields = ("email", "username", "role", "password", "password2",
                  "first_name", "last_name", "phone", "country",
                  "organization_name", "registration_number")

    def validate_role(self, value):
        # On ne peut pas s'auto-créer un compte Admin
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Ce rôle n'est pas accessible à l'inscription.")
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        # Structure doit fournir un numéro d'enregistrement
        if data.get("role") == User.Role.STRUCTURE and not data.get("registration_number"):
            raise serializers.ValidationError(
                {"registration_number": "Obligatoire pour une structure technique."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ("id", "email", "username", "role", "first_name", "last_name",
                  "phone", "avatar", "country", "organization_name",
                  "registration_number", "kyc_status", "created_at")
        read_only_fields = ("id", "role", "kyc_status", "created_at")
