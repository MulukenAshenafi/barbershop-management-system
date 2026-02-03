"""
Firebase Authentication: token verification and user sync.
Uses Firebase Admin SDK; credentials from environment (path or JSON string).
No Firestore/Realtime DB; auth only. No passwords or OTPs stored in backend.
"""
import json
import logging
import os

from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials, auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    firebase_admin = None
    credentials = None
    auth = None

_firebase_app = None


def get_firebase_app():
    """Initialize and return Firebase app from env. Supports path (absolute or relative to project root), inline JSON, or base64 JSON."""
    global _firebase_app
    if not FIREBASE_AVAILABLE:
        logger.warning("Firebase Admin SDK not installed. pip install firebase-admin")
        return None
    if _firebase_app is not None:
        return _firebase_app
    raw = getattr(settings, 'FIREBASE_CREDENTIALS', None) or os.getenv('FIREBASE_CREDENTIALS', '')
    if not raw or not raw.strip():
        logger.warning("FIREBASE_CREDENTIALS not set")
        return None
    raw = raw.strip()
    try:
        # 1) File path: as-is, relative to BASE_DIR, relative to project root, and without "backend/" prefix (Docker: /app is backend root)
        path_candidates = [
            raw,
            os.path.join(settings.BASE_DIR, raw),
            os.path.join(settings.BASE_DIR.parent, raw),
        ]
        if raw.startswith("backend/"):
            path_candidates.append(os.path.join(settings.BASE_DIR, raw.replace("backend/", "", 1)))
        for path in path_candidates:
            if path and os.path.isfile(path):
                cred = credentials.Certificate(path)
                break
        else:
            # 2) Inline JSON
            try:
                cred_dict = json.loads(raw)
                cred = credentials.Certificate(cred_dict)
            except json.JSONDecodeError:
                # 3) Base64-encoded JSON (only if string does not look like a path)
                if "/" in raw or "\\" in raw or not raw.startswith("ey"):
                    logger.warning(
                        "FIREBASE_CREDENTIALS: file not found at %s (tried as path, BASE_DIR, and project root). "
                        "In Docker, mount the JSON file or set FIREBASE_CREDENTIALS to inline JSON.",
                        raw[:80] + "..." if len(raw) > 80 else raw,
                    )
                    return None
                import base64
                try:
                    decoded = base64.b64decode(raw).decode('utf-8')
                    cred_dict = json.loads(decoded)
                    cred = credentials.Certificate(cred_dict)
                except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
                    logger.warning("FIREBASE_CREDENTIALS: not valid base64 JSON")
                    return None
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as e:
        logger.exception("Firebase init failed: %s", e)
        return None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify Firebase ID token and return decoded claims.
    Raises Exception on invalid or expired token.
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase Admin SDK not installed")
    app = get_firebase_app()
    if not app:
        raise Exception("Firebase not initialized. Check FIREBASE_CREDENTIALS.")
    try:
        return auth.verify_id_token(id_token, app=app)
    except Exception as e:
        logger.debug("Firebase token verification failed: %s", e)
        raise Exception("Invalid or expired Firebase token")


def get_or_create_user_from_firebase(firebase_token: dict) -> User:
    """
    Get or create Django user from verified Firebase token.
    Account linking: if user exists by firebase_uid, update; if by email/phone, link firebase_uid.
    No password or OTP stored; trust is from Firebase verification only.
    """
    uid = firebase_token.get('uid')
    email = (firebase_token.get('email') or '').strip() or None
    phone_number = (firebase_token.get('phone_number') or '').strip() or None
    name = (firebase_token.get('name') or firebase_token.get('display_name') or '').strip() or None
    firebase_info = firebase_token.get('firebase', {})
    provider = firebase_info.get('sign_in_provider', 'unknown')

    # Existing user by Firebase UID
    if uid:
        try:
            user = User.objects.get(firebase_uid=uid)
            if email and not user.email:
                user.email = email
            if phone_number is not None and not user.phone_number:
                user.phone_number = phone_number
                user.phone = phone_number or ''
            if name and not user.name:
                user.name = name
            user.firebase_provider = provider
            user.save(update_fields=['email', 'phone_number', 'phone', 'name', 'firebase_provider', 'updated_at'])
            return user
        except User.DoesNotExist:
            pass

    # Account linking: existing user by email
    if email:
        try:
            user = User.objects.get(email__iexact=email)
            user.firebase_uid = uid
            user.firebase_provider = provider
            if phone_number and not user.phone_number:
                user.phone_number = phone_number
                user.phone = phone_number
            if name and not user.name:
                user.name = name
            user.save(update_fields=['firebase_uid', 'firebase_provider', 'phone_number', 'phone', 'name', 'updated_at'])
            return user
        except User.DoesNotExist:
            pass

    # Account linking: existing user by phone_number
    if phone_number:
        try:
            user = User.objects.get(phone_number=phone_number)
            user.firebase_uid = uid
            user.firebase_provider = provider
            if email and not user.email:
                user.email = email
            if name and not user.name:
                user.name = name
            user.save(update_fields=['firebase_uid', 'firebase_provider', 'email', 'name', 'updated_at'])
            return user
        except User.DoesNotExist:
            pass

    # New user: create via Firebase only (no password)
    display_name = name or (email.split('@')[0] if email else f'user_{uid[:8]}')
    return User.objects.create_firebase_user(
        firebase_uid=uid,
        email=email,
        phone_number=phone_number,
        name=display_name,
        firebase_provider=provider,
        role='Customer',
    )
