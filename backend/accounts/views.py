from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer, UserUpdateSerializer,
    DjangoRegisterSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    ChangeEmailRequestSerializer, GuestLoginSerializer,
)
from .permissions import IsAdminUser
from .google_auth import verify_google_id_token, get_or_create_user_from_google
from .models import OneTimeToken
from .email_sender import send_verification_email, send_password_reset_email, send_email_change_confirmation
import logging

logger = logging.getLogger(__name__)

try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('signup', 'login'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
        if user.role == 'Admin':
            return User.objects.all()
        elif user.role == 'Customer':
            # Customers can see barbers
            return User.objects.filter(role='Barber')
        return User.objects.none()
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def signup(self, request):
        """Customer registration endpoint. Accepts JSON or multipart/form-data."""
        # Normalize input: multipart sends all values as strings; only pass expected fields
        data = {}
        for key in ('name', 'email', 'password', 'phone', 'location'):
            val = request.data.get(key)
            if val is not None:
                data[key] = val if isinstance(val, str) else str(val)
        serializer = UserRegistrationSerializer(data=data)
        if not serializer.is_valid():
            errors = serializer.errors
            first_msg = 'Validation failed'
            for _k, v in errors.items():
                if isinstance(v, list) and v:
                    first_msg = str(v[0])
                    break
                if isinstance(v, str):
                    first_msg = v
                    break
            return Response({
                'success': False,
                'message': first_msg,
                'errors': errors,
            }, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save(role='Customer')
        # Optional profile image upload (only if Cloudinary is fully configured)
        if HAS_CLOUDINARY and request.FILES.get('file'):
            from django.conf import settings
            cloud_cfg = getattr(settings, 'CLOUDINARY_STORAGE', {}) or {}
            api_key = (cloud_cfg.get('API_KEY') or '').strip()
            api_secret = (cloud_cfg.get('API_SECRET') or '').strip()
            cloud_name = (cloud_cfg.get('CLOUD_NAME') or '').strip()
            if api_key and api_secret and cloud_name:
                try:
                    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
                    upload_result = cloudinary.uploader.upload(
                        request.FILES['file'],
                        folder='accounts/profiles',
                    )
                    user.profile_pic_url = upload_result.get('secure_url')
                    user.profile_pic_public_id = upload_result.get('public_id')
                    user.save(update_fields=['profile_pic_url', 'profile_pic_public_id'])
                except Exception as e:
                    logger.warning('Profile image upload failed: %s', e)
            else:
                logger.warning('Cloudinary not configured: missing API_KEY, API_SECRET, or CLOUD_NAME (check .env)')
        token = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Customer registered successfully.',
            'user': {
                'id': str(user.uuid),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'profilePic': user.profile_pic,
            },
            'token': str(token.access_token),
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """User login endpoint. Expects JSON: { "email": "..." | "username": "...", "password": "..." }."""
        raw = request.data if isinstance(request.data, dict) else {}
        if not raw:
            logger.warning("login: empty or non-dict body; Content-Type=%s", request.content_type)
            return Response({
                'success': False,
                'message': 'Request body must be JSON with email and password.',
                'errors': {'detail': ['Empty or invalid JSON body']},
            }, status=status.HTTP_400_BAD_REQUEST)
        # Normalize: accept both "email" and "username" (UI: "Email or username")
        data = {
            'email': (raw.get('email') or raw.get('username') or '').strip(),
            'password': raw.get('password') or '',
        }
        serializer = UserLoginSerializer(data=data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = RefreshToken.for_user(user)
            response = Response({
                'success': True,
                'message': 'Login successful.',
                'user': {
                    'id': str(user.uuid),
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'phone': user.phone,
                    'profilePic': user.profile_pic,
                    'location': user.location,
                    'preferences': user.preferences,
                    'specialization': user.specialization,
                },
                'token': str(token.access_token),
                'refresh': str(token),
            }, status=status.HTTP_200_OK)
            response.set_cookie(
                'token',
                str(token.access_token),
                max_age=15 * 24 * 60 * 60,
                httponly=True,
                samesite='Strict',
                secure=not request.get_host().startswith('localhost'),
            )
            return response
        errors = serializer.errors
        first_msg = 'Invalid credentials'
        # Prefer non_field_errors for login (e.g. "Invalid email or password")
        if errors.get('non_field_errors') and isinstance(errors['non_field_errors'], list) and errors['non_field_errors']:
            first_msg = str(errors['non_field_errors'][0])
        else:
            for v in errors.values():
                if isinstance(v, list) and v:
                    first_msg = str(v[0])
                    break
                if isinstance(v, str):
                    first_msg = v
                    break
        logger.info("login validation failed: %s", list(errors.keys()))
        return Response({
            'success': False,
            'message': first_msg,
            'errors': errors,
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'message': 'Access to profile data.',
            'user': serializer.data
        })
    
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Update user profile. Accepts JSON or multipart/form-data (optional file)."""
        # Normalize input: multipart sends all values as strings
        data = {}
        for key in ('name', 'email', 'phone', 'location', 'preferencesOrSpecialization'):
            val = request.data.get(key)
            if val is not None:
                data[key] = val if isinstance(val, str) else str(val)
        serializer = UserUpdateSerializer(request.user, data=data, partial=True)
        if not serializer.is_valid():
            errors = serializer.errors
            first_msg = errors.get('__all__', ['Update failed.'])[0] if isinstance(errors.get('__all__'), list) else 'Update failed.'
            for _k, v in errors.items():
                if isinstance(v, list) and v and _k != '__all__':
                    first_msg = str(v[0])
                    break
                if isinstance(v, str) and _k != '__all__':
                    first_msg = v
                    break
            return Response({
                'success': False,
                'message': first_msg,
                'errors': errors,
            }, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        # Optional profile image upload (same as signup)
        if HAS_CLOUDINARY and request.FILES.get('file'):
            from django.conf import settings as django_settings
            cloud_cfg = getattr(django_settings, 'CLOUDINARY_STORAGE', {}) or {}
            api_key = (cloud_cfg.get('API_KEY') or '').strip()
            api_secret = (cloud_cfg.get('API_SECRET') or '').strip()
            cloud_name = (cloud_cfg.get('CLOUD_NAME') or '').strip()
            if api_key and api_secret and cloud_name:
                try:
                    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
                    upload_result = cloudinary.uploader.upload(
                        request.FILES['file'],
                        folder='accounts/profiles',
                    )
                    user.profile_pic_url = upload_result.get('secure_url')
                    user.profile_pic_public_id = upload_result.get('public_id')
                    user.save(update_fields=['profile_pic_url', 'profile_pic_public_id'])
                    user.refresh_from_db()
                except Exception as e:
                    logger.warning('Profile image upload failed: %s', e)
            else:
                logger.warning('Cloudinary not configured: missing API_KEY, API_SECRET, or CLOUD_NAME (check .env)')
        return Response({
            'success': True,
            'message': 'Profile updated successfully.',
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def set_preferences(self, request):
        """Set preferences for customer."""
        if request.user.role != 'Customer':
            return Response({
                'success': False,
                'message': 'This endpoint is for customers only.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        preferences = request.data.get('preferences')
        if not preferences:
            return Response({
                'success': False,
                'message': 'Preferences are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.preferences = preferences
        request.user.save()
        
        return Response({
            'success': True,
            'message': 'Preferences updated successfully.',
            'user': UserSerializer(request.user).data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def set_specialization(self, request):
        """Set specialization for barber."""
        if request.user.role != 'Barber':
            return Response({
                'success': False,
                'message': 'This endpoint is for barbers only.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        specialization = request.data.get('specialization')
        if not specialization:
            return Response({
                'success': False,
                'message': 'Specialization is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.specialization = specialization
        request.user.save()
        
        return Response({
            'success': True,
            'message': 'Specialization updated successfully.',
            'user': UserSerializer(request.user).data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='social/google')
    def google_login(self, request):
        """Google OAuth login: accepts id_token from client, verifies and returns JWT."""
        id_token_str = request.data.get('id_token')
        if not id_token_str:
            return Response({
                'success': False,
                'message': 'id_token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            payload = verify_google_id_token(id_token_str)
            user = get_or_create_user_from_google(payload)
            token = RefreshToken.for_user(user)
            response = Response({
                'success': True,
                'message': 'Google login successful.',
                'user': {
                    'id': str(user.uuid),
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'phone': user.phone or '',
                    'profilePic': user.profile_pic,
                    'location': user.location or '',
                    'preferences': user.preferences or '',
                    'specialization': user.specialization or '',
                },
                'token': str(token.access_token),
            }, status=status.HTTP_200_OK)
            response.set_cookie(
                'token',
                str(token.access_token),
                max_age=15 * 24 * 60 * 60,
                httponly=True,
                samesite='Strict',
                secure=not request.get_host().startswith('localhost'),
            )
            return response
        except Exception as e:
            logger.warning("Google login error: %s", str(e))
            return Response({
                'success': False,
                'message': str(e) or 'Google authentication failed'
            }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_barber(request):
    """Create barber (admin only)."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save(role='Barber')
        return Response({
            'success': True,
            'message': 'Barber registered successfully.',
            'user': {
                'id': str(user.uuid),
                'name': user.name,
                'email': user.email,
                'role': user.role,
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'message': 'Registration failed.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_barbers(request):
    """Get all barbers."""
    barbers = User.objects.filter(role='Barber')
    
    if request.user.role == 'Admin':
        serializer = UserSerializer(barbers, many=True)
        return Response({
            'success': True,
            'barbers': serializer.data
        })
    elif request.user.role == 'Customer':
        # Limited details for customers
        barber_data = [{
            '_id': str(barber.id),
            'name': barber.name,
            'specialization': barber.specialization,
            'phone': barber.phone,
        } for barber in barbers]
        return Response({
            'success': True,
            'barbers': barber_data
        })
    
    return Response({
        'success': False,
        'message': 'Access denied'
    }, status=status.HTTP_403_FORBIDDEN)


# ----- Django-native auth (register, verify-email, password-reset, change-email, guest-login) -----

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register with first name, last name, email, password.
    Account is inactive until email is verified. Sends verification email.
    Accepts JSON with snake_case (first_name, last_name) or camelCase (firstName, lastName).
    """
    raw = request.data if isinstance(request.data, dict) else {}
    if not raw:
        logger.warning("register: empty or non-dict body; Content-Type=%s", request.content_type)
        return Response({
            'success': False,
            'message': 'Request body must be JSON with first_name, last_name, email, and password.',
            'errors': {'detail': ['Empty or invalid JSON body']},
        }, status=status.HTTP_400_BAD_REQUEST)
    # Normalize: accept both snake_case and camelCase
    data = {
        'first_name': (raw.get('first_name') or raw.get('firstName') or '').strip(),
        'last_name': (raw.get('last_name') or raw.get('lastName') or '').strip(),
        'email': (raw.get('email') or '').strip().lower(),
        'password': raw.get('password') or '',
    }
    serializer = DjangoRegisterSerializer(data=data)
    if not serializer.is_valid():
        errors = serializer.errors
        msg = 'Validation failed'
        for v in errors.values():
            if isinstance(v, list) and v:
                msg = str(v[0])
                break
            if isinstance(v, str):
                msg = v
                break
        return Response({'success': False, 'message': msg, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()
    # Send verification email (token was created in serializer create())
    ott = OneTimeToken.objects.filter(
        user=user, purpose=OneTimeToken.PURPOSE_EMAIL_VERIFICATION
    ).order_by('-created_at').first()
    if ott:
        try:
            send_verification_email(user.email, ott.token)
        except Exception as e:
            logger.warning('Verification email send failed: %s', e)
    return Response({
        'success': True,
        'message': 'Registration successful. Please check your email to verify your account.',
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_email(request, token):
    """
    Verify email using token from link. Activates account and sets email_verified=True.
    Optional: return JWT so app can log user in immediately.
    """
    from django.utils import timezone
    ott = OneTimeToken.objects.filter(
        token=token, purpose=OneTimeToken.PURPOSE_EMAIL_VERIFICATION
    ).select_related('user').first()
    if not ott:
        return Response(
            {'success': False, 'message': 'Invalid or expired verification link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if ott.expires_at < timezone.now():
        ott.delete()
        return Response(
            {'success': False, 'message': 'Verification link has expired.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = ott.user
    user.is_active = True
    user.email_verified = True
    user.save(update_fields=['is_active', 'email_verified'])
    ott.delete()
    # Optionally return JWT so the app can sign the user in
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True,
        'message': 'Email verified. You can now log in.',
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': str(user.uuid),
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'profilePic': user.profile_pic,
        },
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset(request):
    """Request password reset. Sends email with secure link (no user enumeration)."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'message': 'Invalid email.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    email = serializer.validated_data['email']
    user = User.objects.filter(email=email).first()
    if user and not user.is_guest:
        ott = OneTimeToken.create_token(user, OneTimeToken.PURPOSE_PASSWORD_RESET, expires_in_hours=1)
        try:
            send_password_reset_email(user.email, ott.token)
        except Exception as e:
            logger.warning('Password reset email send failed: %s', e)
    return Response({
        'success': True,
        'message': 'If an account exists with this email, you will receive a password reset link.',
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Confirm password reset with token and new password."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        msg = serializer.errors.get('new_password', serializer.errors.get('token', ['Invalid input.']))
        if isinstance(msg, list):
            msg = msg[0] if msg else 'Invalid input.'
        return Response({'success': False, 'message': msg, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    token_str = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']
    from django.utils import timezone
    ott = OneTimeToken.objects.filter(
        token=token_str, purpose=OneTimeToken.PURPOSE_PASSWORD_RESET
    ).select_related('user').first()
    if not ott:
        return Response({'success': False, 'message': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)
    if ott.expires_at < timezone.now():
        ott.delete()
        return Response({'success': False, 'message': 'Reset link has expired.'}, status=status.HTTP_400_BAD_REQUEST)
    user = ott.user
    user.set_password(new_password)
    user.save(update_fields=['password'])
    ott.delete()
    return Response({'success': True, 'message': 'Password has been reset. You can log in with your new password.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_email(request):
    """
    Request email change. Sends confirmation to current email; change is applied when user confirms via link.
    """
    if request.user.is_guest:
        return Response({'success': False, 'message': 'Guest users cannot change email.'}, status=status.HTTP_403_FORBIDDEN)
    serializer = ChangeEmailRequestSerializer(data=request.data)
    if not serializer.is_valid():
        msg = 'Validation failed'
        for v in serializer.errors.values():
            if isinstance(v, list) and v:
                msg = str(v[0])
                break
        return Response({'success': False, 'message': msg, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    new_email = serializer.validated_data['new_email']
    ott = OneTimeToken.create_token(
        request.user, OneTimeToken.PURPOSE_EMAIL_CHANGE, expires_in_hours=1,
        extra_data={'new_email': new_email},
    )
    try:
        send_email_change_confirmation(request.user.email, ott.token, new_email)
    except Exception as e:
        logger.warning('Email change confirmation send failed: %s', e)
        return Response({'success': False, 'message': 'Failed to send confirmation email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({
        'success': True,
        'message': 'A confirmation link has been sent to your current email address.',
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def change_email_confirm(request):
    """
    Confirm email change (token in query or body). Apply new_email from token's extra_data.
    """
    from django.utils import timezone
    token_str = request.data.get('token') or request.query_params.get('token')
    if not token_str:
        return Response({'success': False, 'message': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)
    ott = OneTimeToken.objects.filter(
        token=token_str, purpose=OneTimeToken.PURPOSE_EMAIL_CHANGE
    ).select_related('user').first()
    if not ott:
        return Response({'success': False, 'message': 'Invalid or expired link.'}, status=status.HTTP_400_BAD_REQUEST)
    if ott.expires_at < timezone.now():
        ott.delete()
        return Response({'success': False, 'message': 'Link has expired.'}, status=status.HTTP_400_BAD_REQUEST)
    new_email = (ott.extra_data or {}).get('new_email')
    if not new_email:
        return Response({'success': False, 'message': 'Invalid token data.'}, status=status.HTTP_400_BAD_REQUEST)
    user = ott.user
    user.email = new_email
    user.save(update_fields=['email'])
    ott.delete()
    return Response({'success': True, 'message': 'Email address has been updated.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def guest_login(request):
    """Create a temporary guest user and return JWT. No registration required."""
    serializer = GuestLoginSerializer(data=request.data or {})
    serializer.is_valid(raise_exception=False)
    name = (serializer.validated_data or {}).get('name') or 'Guest'
    user = User.objects.create_guest_user(name=name)
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True,
        'message': 'Signed in as guest.',
        'user': {
            'id': str(user.uuid),
            'name': user.name,
            'email': user.email or '',
            'role': user.role,
            'profilePic': user.profile_pic,
            'isGuest': True,
        },
        'token': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED)
