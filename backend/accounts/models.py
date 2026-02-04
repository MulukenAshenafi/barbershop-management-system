import uuid
import secrets
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


def generate_secure_token():
    """Generate a URL-safe token for email verification, password reset, and email change."""
    return secrets.token_urlsafe(32)


class UserManager(BaseUserManager):
    """Custom user manager. Firebase users are created via create_firebase_user (no password)."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a user with email/password (legacy or admin-created)."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password is None:
            user.set_unusable_password()
        else:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_guest_user(self, **extra_fields):
        """Create a temporary guest user (no email, unusable password). Used for guest login."""
        # Use a unique placeholder email so USERNAME_FIELD is set; never used for login.
        base = f"guest_{uuid.uuid4().hex[:12]}"
        email = f"{base}@guest.local"
        user = self.model(email=email, is_guest=True, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_firebase_user(self, firebase_uid, email=None, phone_number=None, name=None, **extra_fields):
        """Create user from Firebase only. No password stored. Used on first authenticated request."""
        if not firebase_uid:
            raise ValueError('firebase_uid is required')
        user = self.model(
            firebase_uid=firebase_uid,
            email=email or None,
            phone_number=phone_number or None,
            name=name or (email.split('@')[0] if email else f'user_{firebase_uid[:8]}'),
            phone=phone_number or '',
            **extra_fields,
        )
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Admin')
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model. Identity is driven by Firebase; PostgreSQL is system of record for profile/role.
    Public id is uuid (API); firebase_uid is unique and indexed. No passwords stored for Firebase users.
    """

    ROLE_CHOICES = [
        ('Customer', 'Customer'),
        ('Barber', 'Barber'),
        ('Admin', 'Admin'),
    ]

    # Public identifier for API (UUID); Django's default id remains for FKs
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    firebase_uid = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)
    email = models.EmailField(unique=True, db_index=True, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=50, blank=True)  # Display name; for Django register: first_name + last_name
    phone = models.CharField(max_length=20, blank=True)  # Legacy; kept in sync where used
    profile_pic_url = models.URLField(blank=True, null=True)
    profile_pic_public_id = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Customer')
    location = models.CharField(max_length=100, blank=True)
    preferences = models.CharField(max_length=100, blank=True)
    specialization = models.CharField(max_length=100, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)  # Django register: True after verify-email
    is_guest = models.BooleanField(default=False)  # Guest login users; no email/password
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    firebase_provider = models.CharField(max_length=50, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['firebase_uid']),
        ]

    def __str__(self):
        return f"{self.name} ({self.email or self.phone_number or self.firebase_uid or 'no-id'})"

    def get_full_name(self):
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.name or ""

    @property
    def profile_pic(self):
        if self.profile_pic_url:
            return [{
                'public_id': self.profile_pic_public_id or '',
                'url': self.profile_pic_url,
            }]
        return []


class OneTimeToken(models.Model):
    """
    One-time tokens for email verification, password reset, and email change.
    Token is validated and then deleted (or expired entries can be cleaned up).
    """
    PURPOSE_EMAIL_VERIFICATION = 'email_verification'
    PURPOSE_PASSWORD_RESET = 'password_reset'
    PURPOSE_EMAIL_CHANGE = 'email_change'
    PURPOSE_CHOICES = [
        (PURPOSE_EMAIL_VERIFICATION, 'Email verification'),
        (PURPOSE_PASSWORD_RESET, 'Password reset'),
        (PURPOSE_EMAIL_CHANGE, 'Email change'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='one_time_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    # For email_change: store {"new_email": "new@example.com"}
    extra_data = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'accounts_onetimetoken'
        indexes = [models.Index(fields=['token', 'purpose'])]

    def __str__(self):
        return f"{self.purpose} for user {self.user_id} (expires {self.expires_at})"

    @classmethod
    def create_token(cls, user, purpose, expires_in_hours=24, extra_data=None):
        from django.utils import timezone
        from datetime import timedelta
        token = generate_secure_token()
        expires_at = timezone.now() + timedelta(hours=expires_in_hours)
        return cls.objects.create(
            user=user,
            token=token,
            purpose=purpose,
            expires_at=expires_at,
            extra_data=extra_data or {},
        )
