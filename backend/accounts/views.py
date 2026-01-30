from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer, UserUpdateSerializer
)
from .permissions import IsAdminUser
from .firebase_auth import verify_firebase_token, get_or_create_user_from_firebase
import logging

logger = logging.getLogger(__name__)

try:
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
                    upload_result = cloudinary.uploader.upload(
                        request.FILES['file'],
                        folder='accounts/profiles',
                    )
                    user.profile_pic_url = upload_result.get('secure_url')
                    user.profile_pic_public_id = upload_result.get('public_id')
                    user.save(update_fields=['profile_pic_url', 'profile_pic_public_id'])
                except Exception as e:
                    logger.warning('Profile image upload failed: %s', e)
        token = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Customer registered successfully.',
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'profilePic': user.profile_pic,
            },
            'token': str(token.access_token),
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """User login endpoint."""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = RefreshToken.for_user(user)
            
            response = Response({
                'success': True,
                'message': 'Login successful.',
                'user': {
                    'id': str(user.id),
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
            }, status=status.HTTP_200_OK)
            
            # Set HTTP-only cookie (similar to original implementation)
            response.set_cookie(
                'token',
                str(token.access_token),
                max_age=15 * 24 * 60 * 60,  # 15 days
                httponly=True,
                samesite='Strict',
                secure=not request.get_host().startswith('localhost')
            )
            
            return response
        
        return Response({
            'success': False,
            'message': serializer.errors.get('non_field_errors', ['Invalid credentials'])[0]
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
        """Update user profile."""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Update failed.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def firebase_login(self, request):
        """Firebase social login endpoint."""
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response({
                'success': False,
                'message': 'Firebase ID token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify Firebase token
            firebase_token = verify_firebase_token(id_token)
            
            # Get or create user from Firebase
            user = get_or_create_user_from_firebase(firebase_token)
            
            # Generate JWT token
            token = RefreshToken.for_user(user)
            
            response = Response({
                'success': True,
                'message': 'Firebase login successful.',
                'user': {
                    'id': str(user.id),
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
            }, status=status.HTTP_200_OK)
            
            # Set HTTP-only cookie
            response.set_cookie(
                'token',
                str(token.access_token),
                max_age=15 * 24 * 60 * 60,  # 15 days
                httponly=True,
                samesite='Strict',
                secure=not request.get_host().startswith('localhost')
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Firebase login error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'Firebase authentication failed: {str(e)}'
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
                'id': str(user.id),
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
