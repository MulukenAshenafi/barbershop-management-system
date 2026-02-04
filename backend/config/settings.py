"""
Django settings for barbershop management system.
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

# Build paths: BASE_DIR = backend/, project root = BASE_DIR.parent
BASE_DIR = Path(__file__).resolve().parent.parent
# Load .env from project root when present (local/dev). On Render, env is set by the platform.
load_dotenv(BASE_DIR.parent / ".env")


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Comma-separated list from env. In production set ALLOWED_HOSTS (e.g. your-app.onrender.com).
_allowed = os.getenv('ALLOWED_HOSTS', '').strip()
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()] if _allowed else []
# Render sets RENDER_EXTERNAL_HOSTNAME; allow it so the app works without setting ALLOWED_HOSTS.
_render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'cloudinary',
    'cloudinary_storage',
    
    # Local apps
    'accounts',
    'barbershops',
    'services',
    'bookings',
    'payments',
    'notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'barbershops.middleware.BarbershopContextMiddleware',  # Multi-tenant middleware
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database – fully from environment (works with Docker Compose and Render PostgreSQL)
# Local Docker: set DB_HOST=db. Render: set DB_HOST from Render Postgres internal hostname.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'barbershop_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 6,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# Local dev: Docker Compose may mount volumes for staticfiles/media. Production (e.g. Render): no volumes;
# use WhiteNoise for static and Cloudinary or S3 for media (see below).
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework Configuration
# Firebase ID token is primary; JWT kept for legacy/admin if needed.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.FirebaseAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
}

# CamelCase JSON (optional): pip install djangorestframework-camel-case
try:
    from djangorestframework_camel_case.render import CamelCaseJSONRenderer  # noqa: F401
    from djangorestframework_camel_case.parser import CamelCaseJSONParser   # noqa: F401
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
        'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
        'rest_framework.renderers.JSONRenderer',
    )
    REST_FRAMEWORK['DEFAULT_PARSER_CLASSES'] = (
        'djangorestframework_camel_case.parser.CamelCaseJSONParser',
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    )
except ImportError:
    pass

# Add drf_spectacular if installed
try:
    import drf_spectacular
    INSTALLED_APPS.append('drf_spectacular')
    REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] = 'drf_spectacular.openapi.AutoSchema'
except ImportError:
    pass

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS: fully from env. Set CORS_ALLOWED_ORIGINS (comma-separated) in production.
_cors = os.getenv('CORS_ALLOWED_ORIGINS', '').strip()
if _cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:19006", "http://localhost:8081", "http://127.0.0.1:8081",
    ]
CORS_ALLOW_CREDENTIALS = True

# Cloudinary (optional). When set, media uploads go to Cloudinary. Production: use Cloudinary or S3.
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_NAME', ''),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.getenv('CLOUDINARY_SECRET', ''),
}
_use_cloudinary = bool(os.getenv('CLOUDINARY_NAME', '').strip())
if _use_cloudinary:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Chapa Payment Gateway Settings
CHAPA_SECRET_KEY = os.getenv('CHAPA_SECRET_KEY', '')
CHAPA_PUBLIC_KEY = os.getenv('CHAPA_PUBLIC_KEY', '')
CHAPA_WEBHOOK_SECRET = os.getenv('CHAPA_WEBHOOK_SECRET', '')
CHAPA_WEBHOOK_URL = os.getenv('CHAPA_WEBHOOK_URL', '')
CHAPA_ENCRYPTION_KEY = os.getenv('CHAPA_ENCRYPTION_KEY', '') or os.getenv('CHAPA_ENCRIPTION_KEY', '')

# Firebase Settings
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', '')
FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS', '')

# Google OAuth (for "Continue with Google" – use same client ID as Expo EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

# API Documentation (Swagger/OpenAPI)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Barbershop Management System API',
    'DESCRIPTION': 'REST API for barbershop management system with booking, products, and payment integration',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/',
    'COMPONENT_SPLIT_REQUEST': True,
    'AUTHENTICATION_WHITELIST': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# Caching Configuration (Redis) - Optional
# Defaults to Docker service name 'redis' when in Docker, '127.0.0.1' locally
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')
try:
    import django_redis
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': 'bsbs',
            'TIMEOUT': 300,  # 5 minutes default
        }
    }
    # Session cache (optional, uses default cache)
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'default'
except ImportError:
    # Fallback to local memory cache if Redis not available
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'KEY_PREFIX': 'bsbs',
            'TIMEOUT': 300,
        }
    }

# Logging: console always; file only when LOG_TO_FILE=true (e.g. local dev). On Render, use console only.
_log_to_file = os.getenv('LOG_TO_FILE', 'false').lower() == 'true'
_handlers_root = ['console']
if _log_to_file:
    logs_dir = BASE_DIR / 'logs'
    if not logs_dir.exists():
        os.makedirs(logs_dir, exist_ok=True)
    _handlers_root.append('file')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': _handlers_root,
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': _handlers_root,
            'level': 'INFO',
            'propagate': False,
        },
        'payments': {
            'handlers': _handlers_root,
            'level': 'INFO',
            'propagate': False,
        },
        'accounts': {
            'handlers': _handlers_root,
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Celery (optional): pip install celery django-celery-beat redis
# Run: celery -A config worker -l info && celery -A config beat -l info
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_BEAT_SCHEDULE = {
    'booking-reminders': {
        'task': 'notifications.tasks.send_booking_reminders_task',
        'schedule': 300.0,  # Every 5 minutes
    },
}
