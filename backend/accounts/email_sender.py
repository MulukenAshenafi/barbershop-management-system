"""
Send verification, password-reset, and email-change emails via Django SMTP backend.
Uses EMAIL_VERIFICATION_BASE_URL for link base (e.g. app deep link or web URL).
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _base_url():
    return (getattr(settings, 'EMAIL_VERIFICATION_BASE_URL', None) or '').strip() or 'http://localhost:8081'


def send_verification_email(to_email, token):
    """Send email verification link. Link: {base}/verify-email/{token}/ or similar."""
    base = _base_url().rstrip('/')
    link = f"{base}/verify-email/{token}/"
    subject = 'Verify your email - BarberBook'
    message = (
        f'Please verify your email by opening this link in the app or browser:\n\n{link}\n\n'
        'This link expires in 24 hours. If you did not create an account, ignore this email.'
    )
    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@barberbook.local'),
            [to_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.exception('Failed to send verification email: %s', e)
        raise


def send_password_reset_email(to_email, token):
    """Send password reset link."""
    base = _base_url().rstrip('/')
    link = f"{base}/password-reset/confirm?token={token}"
    subject = 'Reset your password - BarberBook'
    message = (
        f'To reset your password, open this link:\n\n{link}\n\n'
        'This link expires in 1 hour. If you did not request a reset, ignore this email.'
    )
    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@barberbook.local'),
            [to_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.exception('Failed to send password reset email: %s', e)
        raise


def send_email_change_confirmation(to_email_original, token, new_email):
    """Send to original address: confirm change to new_email."""
    base = _base_url().rstrip('/')
    link = f"{base}/change-email/confirm?token={token}"
    subject = 'Confirm email change - BarberBook'
    message = (
        f'You requested to change your email to: {new_email}\n\n'
        f'Confirm by opening this link:\n\n{link}\n\n'
        'This link expires in 1 hour. If you did not request this, ignore this email.'
    )
    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@barberbook.local'),
            [to_email_original],
            fail_silently=False,
        )
    except Exception as e:
        logger.exception('Failed to send email change confirmation: %s', e)
        raise
