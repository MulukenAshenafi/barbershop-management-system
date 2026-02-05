from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OneTimeToken


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
    """Email/password login. Accepts 'email' or 'username' (both used as email lookup). Rejects if inactive or email not verified."""
    email = serializers.CharField(allow_blank=False, trim_whitespace=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = (attrs.get('email') or '').strip()
        password = attrs.get('password')
        if not email:
            raise serializers.ValidationError({'email': ['Please enter your email or username.']})
        if not password:
            raise serializers.ValidationError({'password': ['Please enter your password.']})
        # Look up by email (case-insensitive); frontend may send "email or username" in one field
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError({'non_field_errors': ['Invalid email or password.']})
        if not user.check_password(password):
            raise serializers.ValidationError({'non_field_errors': ['Invalid email or password.']})
        if not user.is_active:
            raise serializers.ValidationError({'non_field_errors': ['User account is disabled.']})
        if not user.is_guest and not user.email_verified:
            raise serializers.ValidationError({'non_field_errors': ['Please verify your email before logging in.']})
        attrs['user'] = user
        return attrs


class DjangoRegisterSerializer(serializers.Serializer):
    """Registration: first name, last name, email, password. Account inactive until email verified."""
    first_name = serializers.CharField(max_length=50, trim_whitespace=True, allow_blank=False)
    last_name = serializers.CharField(max_length=50, trim_whitespace=True, allow_blank=False)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return (value or '').strip().lower()

    def create(self, validated_data):
        first_name = validated_data['first_name'].strip()
        last_name = validated_data['last_name'].strip()
        name = f"{first_name} {last_name}".strip() or "User"
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            name=name,
            is_active=False,
            email_verified=False,
            role='Customer',
        )
        # One-time token for email verification (e.g. 24h)
        OneTimeToken.create_token(user, OneTimeToken.PURPOSE_EMAIL_VERIFICATION, expires_in_hours=24)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request password reset: send email with link containing token."""
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            # Don't reveal whether email exists; still return success
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm password reset with token and new password."""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)


class ChangeEmailRequestSerializer(serializers.Serializer):
    """Request email change. Sends confirmation to current email; change applied when user confirms."""
    new_email = serializers.EmailField()
    current_password = serializers.CharField(write_only=True, required=False)

    def validate_new_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value


class GuestLoginSerializer(serializers.Serializer):
    """Optional display name for guest user. No required fields."""
    name = serializers.CharField(max_length=50, required=False, allow_blank=True, default='Guest')


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
