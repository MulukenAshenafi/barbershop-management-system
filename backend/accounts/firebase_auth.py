"""
Firebase Authentication Helper
Handles Firebase token verification and user creation/authentication
"""
try:
    import firebase_admin
    from firebase_admin import credentials, auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    firebase_admin = None
    credentials = None
    auth = None

from django.conf import settings
from django.contrib.auth import get_user_model
from .models import User
import logging
import os

logger = logging.getLogger(__name__)

User = get_user_model()

# Initialize Firebase Admin SDK
_firebase_app = None


def get_firebase_app():
    """Initialize and return Firebase app instance."""
    global _firebase_app
    
    if not FIREBASE_AVAILABLE:
        logger.warning("Firebase Admin SDK not installed. Install with: pip install firebase-admin")
        return None
    
    if _firebase_app is None:
        try:
            firebase_credentials_path = settings.FIREBASE_CREDENTIALS
            
            if not firebase_credentials_path:
                logger.warning("FIREBASE_CREDENTIALS not configured")
                return None
            
            if os.path.exists(firebase_credentials_path):
                cred = credentials.Certificate(firebase_credentials_path)
                _firebase_app = firebase_admin.initialize_app(cred)
            else:
                # Try to parse as JSON string if path doesn't exist
                import json
                try:
                    cred_dict = json.loads(firebase_credentials_path)
                    cred = credentials.Certificate(cred_dict)
                    _firebase_app = firebase_admin.initialize_app(cred)
                except (json.JSONDecodeError, ValueError):
                    logger.warning("Firebase credentials not properly configured")
                    return None
        except Exception as e:
            logger.error(f"Firebase initialization error: {str(e)}")
            return None
    
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify Firebase ID token and return decoded token.
    
    Args:
        id_token: Firebase ID token from client
        
    Returns:
        Decoded token with user information
        
    Raises:
        Exception: If token verification fails
    """
    if not FIREBASE_AVAILABLE:
        raise Exception("Firebase Admin SDK not installed. Install with: pip install firebase-admin")
    
    app = get_firebase_app()
    if not app:
        raise Exception("Firebase not initialized. Check FIREBASE_CREDENTIALS in settings.")
    
    try:
        decoded_token = auth.verify_id_token(id_token, app=app)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase token verification error: {str(e)}")
        raise Exception(f"Invalid Firebase token: {str(e)}")


def get_or_create_user_from_firebase(firebase_token: dict) -> User:
    """
    Get or create Django user from Firebase token.
    
    Args:
        firebase_token: Decoded Firebase token
        
    Returns:
        User instance
    """
    firebase_uid = firebase_token.get('uid')
    email = firebase_token.get('email', '')
    name = firebase_token.get('name', firebase_token.get('display_name', ''))
    phone = firebase_token.get('phone_number', '')
    
    # Get provider info
    firebase_user = firebase_token.get('firebase', {})
    provider = firebase_user.get('sign_in_provider', 'unknown')
    
    # Try to find existing user by Firebase UID
    try:
        user = User.objects.get(firebase_uid=firebase_uid)
        # Update user info if needed
        if email and not user.email:
            user.email = email
        if name and not user.name:
            user.name = name
        if phone and not user.phone:
            user.phone = phone
        user.firebase_provider = provider
        user.save()
        return user
    except User.DoesNotExist:
        pass
    
    # Try to find by email
    if email:
        try:
            user = User.objects.get(email=email)
            # Link Firebase UID to existing user
            user.firebase_uid = firebase_uid
            user.firebase_provider = provider
            if not user.name and name:
                user.name = name
            if not user.phone and phone:
                user.phone = phone
            user.save()
            return user
        except User.DoesNotExist:
            pass
    
    # Create new user
    # Generate a unique email if not provided
    if not email:
        email = f"{firebase_uid}@firebase.local"
    
    # Generate a name if not provided
    if not name:
        name = email.split('@')[0]
    
    user = User.objects.create_user(
        email=email,
        name=name,
        phone=phone or '',
        firebase_uid=firebase_uid,
        firebase_provider=provider,
        role='Customer'  # Default role
    )
    
    return user
