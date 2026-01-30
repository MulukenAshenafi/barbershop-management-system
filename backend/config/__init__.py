# Load Celery app when Django starts (optional - Celery must be installed)
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    pass
