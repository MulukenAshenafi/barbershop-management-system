"""
Firebase Authentication: token verification and user sync.
Uses Firebase Admin SDK; credentials from FIREBASE_CREDENTIALS_BASE64 (base64-encoded JSON).
No Firestore/Realtime DB; auth only. No passwords or OTPs stored in backend.
"""
import base64
import json
import logging
import os

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
    """
    Initialize and return Firebase app from FIREBASE_CREDENTIALS_BASE64.
    Decodes base64 to JSON and uses firebase_admin.credentials.Certificate().
    If FIREBASE_CREDENTIALS_BASE64 is missing, skips initialization and logs a warning.
    """
    global _firebase_app
    if not FIREBASE_AVAILABLE:
        logger.warning("Firebase Admin SDK not installed. pip install firebase-admin")
        return None
    if _firebase_app is not None:
        return _firebase_app

    raw = (os.getenv('FIREBASE_CREDENTIALS_BASE64') or '').strip().replace('\n', '').replace('\r', '')
    if not raw:
        logger.warning(
            "FIREBASE_CREDENTIALS_BASE64 is not set. Firebase Admin will not be initialized. "
            "Set it to base64-encoded service account JSON for Firebase auth (e.g. on Render)."
        )
        return None

    try:
        decoded = base64.b64decode(raw).decode('utf-8').strip()
        cred_dict = json.loads(decoded)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized from FIREBASE_CREDENTIALS_BASE64.")
        return _firebase_app
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as e:
        logger.exception(
            "FIREBASE_CREDENTIALS_BASE64 is not valid base64-encoded JSON. Firebase init skipped: %s",
            e,
        )
        return None
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
        raise Exception(
            "Firebase not initialized. Set FIREBASE_CREDENTIALS_BASE64 (base64-encoded service account JSON)."
        )
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
