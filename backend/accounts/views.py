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

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        if user.role == 'Admin':
            return User.objects.all()
        elif user.role == 'Customer':
            # Customers can see barbers
            return User.objects.filter(role='Barber')
        return User.objects.none()
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def signup(self, request):
        """Customer registration endpoint."""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(role='Customer')
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
        
        return Response({
            'success': False,
            'message': 'Registration failed.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
