from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
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
    """Custom user model."""
    
    ROLE_CHOICES = [
        ('Customer', 'Customer'),
        ('Barber', 'Barber'),
        ('Admin', 'Admin'),
    ]
    
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    profile_pic_url = models.URLField(blank=True, null=True)
    profile_pic_public_id = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Customer')
    location = models.CharField(max_length=100, blank=True)
    preferences = models.CharField(max_length=100, blank=True)  # For customers
    specialization = models.CharField(max_length=100, blank=True)  # For barbers
    
    # Django auth fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    # Firebase social login fields (placeholder)
    firebase_uid = models.CharField(max_length=255, blank=True, null=True, unique=True)
    firebase_provider = models.CharField(max_length=50, blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'phone']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    @property
    def profile_pic(self):
        """Return profile pic in format compatible with frontend."""
        if self.profile_pic_url:
            return [{
                'public_id': self.profile_pic_public_id or '',
                'url': self.profile_pic_url
            }]
        return []
