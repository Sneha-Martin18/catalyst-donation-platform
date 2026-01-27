from rest_framework import serializers
import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email as django_validate_email
from .models import UserProfile

User = get_user_model()

#___________USER REGISTRATION SERIALIZER_________#


# 🔐 Custom password rules
def custom_password_validator(password):
    if len(password) < 7:
        raise serializers.ValidationError(
            "Password must be at least 7 characters long."
        )

    if not re.search(r"\d", password):
        raise serializers.ValidationError(
            "Password must contain at least one number."
        )

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise serializers.ValidationError(
            "Password must contain at least one special character."
        )


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role']

    # 🔄 Cross-field validation
    def validate(self, attrs):
        password = attrs.get("password")
        password2 = attrs.get("password2")

        if password != password2:
            raise serializers.ValidationError({
                "password": "Passwords must match."
            })

        # apply custom password rules
        validate_password(password)

        return attrs

    # 👤 Username validation
    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username cannot be empty.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    # 📧 Email validation
    def validate_email(self, value):
        value = value.strip().lower()
        try:
            django_validate_email(value)
        except Exception:
            raise serializers.ValidationError("Enter a valid email address.")

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    # 🚀 Create user
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        # Ensure user is active by default
        user.is_active = True
        user.save()
        return user
    
    
#___________USER PROFILE SERIALIZER_________#
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'address',
            'phone_number',
            'profile_picture',
            'rating',
            'aadhaar_last4',
            'aadhaar_verified'
        ]


#___________USER SERIALIZER_________#
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'date_of_birth',
            'profile',
        ]

