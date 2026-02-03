"""
DRF authentication: verify Firebase ID token and set request.user.
Protected routes require valid Bearer token; invalid/missing returns 401.
"""
import logging

from rest_framework import authentication
from rest_framework import exceptions

from .firebase_auth import verify_firebase_token, get_or_create_user_from_firebase

logger = logging.getLogger(__name__)


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Verify Firebase ID token from Authorization: Bearer <id_token> and set request.user.
    Rejects with 401 on missing or invalid token.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)
        if not auth_header:
            return None
        parts = auth_header.decode('utf-8').split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None
        id_token = parts[1].strip()
        if not id_token:
            return None
        try:
            decoded = verify_firebase_token(id_token)
            user = get_or_create_user_from_firebase(decoded)
            if not user.is_active:
                raise exceptions.AuthenticationFailed('User account is disabled.')
            return (user, id_token)
        except Exception as e:
            msg = str(e) if str(e) else 'Invalid Firebase token'
            logger.debug("Firebase auth failed: %s", msg)
            # Return None so AllowAny endpoints still work; protected routes will get 401 from permission check
            return None

    def authenticate_header(self, request):
        return self.keyword
