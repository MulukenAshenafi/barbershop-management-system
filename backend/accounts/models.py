import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


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
    name = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)  # Legacy; kept in sync where used
    profile_pic_url = models.URLField(blank=True, null=True)
    profile_pic_public_id = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Customer')
    location = models.CharField(max_length=100, blank=True)
    preferences = models.CharField(max_length=100, blank=True)
    specialization = models.CharField(max_length=100, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
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

    @property
    def profile_pic(self):
        if self.profile_pic_url:
            return [{
                'public_id': self.profile_pic_public_id or '',
                'url': self.profile_pic_url,
            }]
        return []
