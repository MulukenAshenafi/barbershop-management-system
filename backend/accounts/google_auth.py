"""
Google OAuth ID token verification.
Verifies Google id_token from client and returns payload (email, name, sub).
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    id_token = None
    google_requests = None


def verify_google_id_token(id_token_str: str) -> dict:
    """
    Verify Google OAuth2 id_token and return decoded payload.

    Args:
        id_token_str: id_token from Google OAuth (e.g. from Expo AuthSession).

    Returns:
        Decoded token with 'sub', 'email', 'name', etc.

    Raises:
        Exception: If token is invalid or verification fails.
    """
    if not GOOGLE_AUTH_AVAILABLE:
        raise Exception("google-auth is not installed. Install with: pip install google-auth")

    client_id = getattr(settings, "GOOGLE_CLIENT_ID", None) or ""
    if not (client_id and client_id.strip()):
        raise Exception("GOOGLE_CLIENT_ID is not configured in settings.")

    try:
        request = google_requests.Request()
        payload = id_token.verify_oauth2_token(
            id_token_str, request, client_id.strip()
        )
        return payload
    except Exception as e:
        logger.warning("Google id_token verification failed: %s", str(e))
        raise Exception(f"Invalid Google token: {str(e)}")


def get_or_create_user_from_google(google_payload: dict) -> User:
    """
    Get or create Django user from verified Google token payload.

    Args:
        google_payload: Decoded Google id_token (must contain 'email' or 'sub').

    Returns:
        User instance (Customer role).
    """
    email = (google_payload.get("email") or "").strip()
    name = (google_payload.get("name") or "").strip()
    sub = (google_payload.get("sub") or "").strip()

    if not email and sub:
        email = f"{sub}@google.local"
    if not email:
        raise ValueError("Google token has no email or sub.")

    # Find by email
    try:
        user = User.objects.get(email__iexact=email)
        if name and not user.name:
            user.name = name
            user.save(update_fields=["name"])
        return user
    except User.DoesNotExist:
        pass

    if not name:
        name = email.split("@")[0] or "User"

    user = User.objects.create_user(
        email=email,
        name=name,
        phone="",
        role="Customer",
    )
    return user
