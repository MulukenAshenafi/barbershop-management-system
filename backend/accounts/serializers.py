from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """User serializer for general use. Exposes uuid as id for API."""
    id = serializers.UUIDField(source='uuid', read_only=True)
    profilePic = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone', 'phone_number', 'role', 'profilePic',
            'location', 'preferences', 'specialization', 'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at']

    def get_profilePic(self, obj):
        return obj.profile_pic


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration (legacy/admin-created users with password)."""
    password = serializers.CharField(write_only=True, min_length=6)
    id = serializers.UUIDField(source='uuid', read_only=True)
    profilePic = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'password', 'phone', 'phone_number', 'location',
            'role', 'profilePic'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': True},
            'id': {'read_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def get_profilePic(self, obj):
        return obj.profile_pic


class UserLoginSerializer(serializers.Serializer):
    """Legacy email/password login (for users created with password)."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        if not email or not password:
            raise serializers.ValidationError('Please enter both email and password.')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        attrs['user'] = user
        return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    id = serializers.UUIDField(source='uuid', read_only=True)
    profilePic = serializers.SerializerMethodField()
    preferencesOrSpecialization = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone', 'phone_number', 'location', 'preferencesOrSpecialization',
            'profilePic'
        ]

    def update(self, instance, validated_data):
        preferences_or_specialization = validated_data.pop('preferencesOrSpecialization', None)
        if preferences_or_specialization is not None:
            if instance.role == 'Customer':
                instance.preferences = preferences_or_specialization
            elif instance.role == 'Barber':
                instance.specialization = preferences_or_specialization
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def get_profilePic(self, obj):
        return obj.profile_pic
