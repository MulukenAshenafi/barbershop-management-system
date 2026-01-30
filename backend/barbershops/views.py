"""Barbershop registration, my-shops, invite/accept, public discovery, staff management."""
import logging
import uuid
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import Barbershop, BarbershopStaff, StaffInvitation, Review
from .serializers import (
    BarbershopRegistrationSerializer,
    BarbershopListSerializer,
    StaffInvitationSerializer,
    BarbershopStaffSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
)
from .permissions import IsBarbershopAdmin, IsBarbershopOwner

logger = logging.getLogger(__name__)

try:
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def barbershop_register(request):
    """
    POST /api/barbershops/register/
    Payload: name, slug (optional), address, city, country, phone, email,
    opening_hours (JSON), logo (optional image file).
    Creates Barbershop with owner=request.user, BarbershopStaff role=Admin,
    returns full barbershop with id, subdomain, owner_role.
    """
    data = request.data.copy()
    if request.FILES.get('logo'):
        data.pop('logo', None)
    serializer = BarbershopRegistrationSerializer(data=data, context={'request': request})
    if not serializer.is_valid():
        return Response(
            {'success': False, 'message': 'Validation failed', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    barbershop = serializer.save()
    # Geocode address if lat/lng not provided
    if barbershop.latitude is None and barbershop.longitude is None and barbershop.address and barbershop.city:
        try:
            from .geocoding import GeocodingService
            coords = GeocodingService.address_to_coords(
                barbershop.address, barbershop.city, barbershop.country or ''
            )
            if coords:
                barbershop.latitude = coords['lat']
                barbershop.longitude = coords['lng']
                barbershop.save(update_fields=['latitude', 'longitude'])
        except Exception as e:
            logger.warning('Geocoding failed for barbershop %s: %s', barbershop.id, e)
    # Optional logo upload
    if HAS_CLOUDINARY and request.FILES.get('logo'):
        from django.conf import settings
        cloud_cfg = getattr(settings, 'CLOUDINARY_STORAGE', {}) or {}
        if cloud_cfg.get('API_KEY') and cloud_cfg.get('API_SECRET') and cloud_cfg.get('CLOUD_NAME'):
            try:
                upload_result = cloudinary.uploader.upload(
                    request.FILES['logo'],
                    folder=f'barbershops/{barbershop.id}',
                )
                barbershop.logo_url = upload_result.get('secure_url')
                barbershop.logo_public_id = upload_result.get('public_id')
                barbershop.save(update_fields=['logo_url', 'logo_public_id'])
            except Exception as e:
                logger.warning('Barbershop logo upload failed: %s', e)
    # Build response with owner_role
    staff = BarbershopStaff.objects.filter(barbershop=barbershop, user=request.user).first()
    owner_role = staff.role if staff else 'Admin'
    out_serializer = BarbershopListSerializer(barbershop, context={'request': request})
    payload = out_serializer.data
    payload['owner_role'] = owner_role
    return Response({
        'success': True,
        'message': 'Barbershop registered successfully.',
        'barbershop': payload,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_shops(request):
    """
    GET /api/barbershops/my-shops/
    Returns list of barbershops where user is staff or owner, with roles.
    """
    # Barbershops owned
    owned_ids = list(
        Barbershop.objects.filter(owner=request.user, is_active=True).values_list('id', flat=True)
    )
    # Barbershops where user is staff
    staff_shops = BarbershopStaff.objects.filter(
        user=request.user,
        is_active=True,
        barbershop__is_active=True,
    ).select_related('barbershop')
    shop_ids = set(owned_ids)
    for s in staff_shops:
        shop_ids.add(s.barbershop_id)
    barbershops = Barbershop.objects.filter(id__in=shop_ids).order_by('name')
    serializer = BarbershopListSerializer(barbershops, many=True, context={'request': request})
    return Response({
        'success': True,
        'barbershops': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_name(request):
    """
    GET /api/barbershops/check-name/?name=...
    Returns { available: true/false } for name uniqueness (by slug derived from name).
    """
    name = (request.query_params.get('name') or '').strip()
    if not name:
        return Response(
            {'success': False, 'message': 'Query parameter "name" is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    slug = name.lower().replace(' ', '-')
    slug = ''.join(c for c in slug if c in 'abcdefghijklmnopqrstuvwxyz0-9-')
    slug = '-'.join(filter(None, slug.split('-')))
    if not slug:
        slug = 'shop'
    base_slug = slug
    n = 0
    while Barbershop.objects.filter(slug=slug).exists():
        n += 1
        slug = f'{base_slug}-{n}'
    available = slug == base_slug
    return Response({
        'success': True,
        'available': available,
        'suggested_slug': slug,
    })


class BarbershopDetailView(APIView):
    """GET/PATCH/DELETE a barbershop (admin/owner only). Barbershop from URL pk."""
    permission_classes = [IsAuthenticated, IsBarbershopAdmin]

    def get_barbershop(self, request, pk):
        barbershop = Barbershop.objects.filter(pk=pk, is_active=True).first()
        if not barbershop:
            return None
        request.barbershop = barbershop
        request.barbershop_id = barbershop.id
        return barbershop

    def _check_and_get(self, request, pk):
        barbershop = self.get_barbershop(request, pk)
        if not barbershop:
            return None, Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not IsBarbershopAdmin().has_permission(request, self):
            return None, Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return barbershop, None

    def get(self, request, pk):
        barbershop, err = self._check_and_get(request, pk)
        if err:
            return err
        serializer = BarbershopListSerializer(barbershop, context={'request': request})
        return Response({'success': True, 'barbershop': serializer.data})

    def patch(self, request, pk):
        barbershop, err = self._check_and_get(request, pk)
        if err:
            return err
        serializer = BarbershopRegistrationSerializer(
            barbershop, data=request.data, partial=True, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        out = BarbershopListSerializer(barbershop, context={'request': request})
        return Response({'success': True, 'barbershop': out.data})

    def delete(self, request, pk):
        barbershop, err = self._check_and_get(request, pk)
        if err:
            return err
        if not IsBarbershopOwner().has_permission(request, self):
            return Response({'detail': 'Only the owner can delete the barbershop.'}, status=status.HTTP_403_FORBIDDEN)
        barbershop.deleted_at = timezone.now()
        barbershop.save(update_fields=['deleted_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---- Invitation ----
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBarbershopAdmin])
def invite_staff(request):
    """
    POST /api/barbershops/invite/
    Payload: email, role (default Barber).
    Owner/Admin only. Requires X-Barbershop-Id or single-shop context.
    """
    barbershop = getattr(request, 'barbershop', None)
    if not barbershop:
        return Response(
            {'detail': 'Barbershop context required. Set X-Barbershop-Id or select your shop.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    email = (request.data.get('email') or '').strip()
    if not email:
        return Response({'detail': 'email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    role = request.data.get('role') or 'Barber'
    if role not in ('Barber', 'Admin'):
        role = 'Barber'
    token = str(uuid.uuid4()).replace('-', '')
    expires_at = timezone.now() + timedelta(hours=24)
    inv = StaffInvitation.objects.create(
        barbershop=barbershop,
        email=email,
        role=role,
        token=token,
        created_by=request.user,
        expires_at=expires_at,
    )
    invite_url = f'http://localhost/accept-invite?token={token}'
    logger.info('INVITE: %s', invite_url)
    serializer = StaffInvitationSerializer(inv)
    return Response({
        'success': True,
        'message': 'Invitation created.',
        'invitation': serializer.data,
        'invite_url': invite_url,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invite(request):
    """
    POST /api/barbershops/invite/accept/
    Payload: token.
    Validates token (not expired, not used), creates BarbershopStaff, marks used, returns barbershop context.
    """
    token = (request.data.get('token') or '').strip()
    if not token:
        return Response({'detail': 'token is required.'}, status=status.HTTP_400_BAD_REQUEST)
    inv = StaffInvitation.objects.filter(token=token, is_used=False).select_related('barbershop').first()
    if not inv:
        return Response({'detail': 'Invalid or expired invitation.'}, status=status.HTTP_404_NOT_FOUND)
    if inv.expires_at < timezone.now():
        return Response({'detail': 'Invitation has expired.'}, status=status.HTTP_400_BAD_REQUEST)
    barbershop = inv.barbershop
    if not barbershop.is_active or barbershop.deleted_at:
        return Response({'detail': 'Barbershop is no longer available.'}, status=status.HTTP_400_BAD_REQUEST)
    staff, created = BarbershopStaff.objects.get_or_create(
        barbershop=barbershop,
        user=request.user,
        defaults={'role': inv.role, 'is_active': True},
    )
    if not created:
        staff.role = inv.role
        staff.is_active = True
        staff.save(update_fields=['role', 'is_active'])
    inv.is_used = True
    inv.save(update_fields=['is_used'])

    # Push: notify inviter (owner) that someone accepted
    try:
        from notifications.services import PushNotificationService
        PushNotificationService.notify_user(
            inv.created_by,
            'Invitation Accepted',
            f'{request.user.name} joined {barbershop.name} as {staff.role}.',
            {'type': 'invite_accepted', 'barbershop_id': barbershop.id, 'user_id': request.user.id},
            category='general',
        )
    except Exception:
        pass

    out = BarbershopListSerializer(barbershop, context={'request': request})
    return Response({
        'success': True,
        'message': 'Invitation accepted.',
        'barbershop': out.data,
        'role': staff.role,
    })


# ---- Public discovery (read-only, no auth required) ----
class PublicBarbershopPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _shop_public_item(b, distance_km=None):
    """Build one public list item; include lat/lng and distance when available."""
    item = {
        'id': b.id,
        'name': b.name,
        'slug': b.slug,
        'city': b.city,
        'country': b.country,
        'logo_url': b.logo_url,
        'address': b.address,
    }
    if getattr(b, 'latitude', None) is not None:
        item['latitude'] = float(b.latitude)
    if getattr(b, 'longitude', None) is not None:
        item['longitude'] = float(b.longitude)
    if distance_km is not None:
        item['distance_km'] = round(float(distance_km), 2)
    return item


@api_view(['GET'])
@permission_classes([AllowAny])
def public_list(request):
    """
    GET /api/barbershops/public/
    List verified & active barbershops. Pagination, search by name/city.
    Optional: lat, lng -> order by distance and include distance_km.
    """
    qs = Barbershop.objects.filter(
        is_active=True,
        is_verified=True,
        subscription_status__in=['active', 'trial'],
    )
    search = (request.query_params.get('search') or request.query_params.get('q') or '').strip()
    if search:
        qs = qs.filter(
            Q(name__icontains=search) | Q(city__icontains=search) | Q(slug__icontains=search)
        )
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    if lat is not None and lng is not None:
        try:
            lat_f, lng_f = float(lat), float(lng)
            qs_geo = qs.filter(latitude__isnull=False, longitude__isnull=False)
            shops_with_distance = [(b, b.distance_from_km(lat_f, lng_f)) for b in qs_geo]
            shops_with_distance.sort(key=lambda x: (x[1] or float('inf'), x[0].id))
            ordered_shops = [b for b, _ in shops_with_distance]
            paginator = PublicBarbershopPagination()
            page_num = request.query_params.get('page', 1)
            try:
                page_num = max(1, int(page_num))
            except (TypeError, ValueError):
                page_num = 1
            page_size = paginator.get_page_size(request)
            start = (page_num - 1) * page_size
            end = start + page_size
            page = ordered_shops[start:end]
            data = [_shop_public_item(b, b.distance_from_km(lat_f, lng_f)) for b in page]
            return Response({
                'results': data,
                'count': len(ordered_shops),
                'next': end < len(ordered_shops),
                'previous': page_num > 1,
            })
        except (TypeError, ValueError):
            pass
    qs = qs.order_by('name')
    paginator = PublicBarbershopPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        data = [_shop_public_item(b) for b in page]
        return paginator.get_paginated_response({'results': data})
    data = [_shop_public_item(b) for b in qs[:20]]
    return Response({'results': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def nearby(request):
    """
    GET /api/barbershops/nearby/?lat=...&lng=...&radius=5
    Barbershops within radius_km (default 5) of (lat, lng). Ordered by distance (Haversine).
    """
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    if lat is None or lng is None:
        return Response(
            {'detail': 'Query parameters "lat" and "lng" are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        lat_f, lng_f = float(lat), float(lng)
    except (TypeError, ValueError):
        return Response({'detail': 'Invalid lat or lng.'}, status=status.HTTP_400_BAD_REQUEST)
    radius_km = 5
    r = request.query_params.get('radius')
    if r is not None:
        try:
            radius_km = max(1, min(50, int(r)))
        except (TypeError, ValueError):
            pass
    qs = Barbershop.objects.filter(
        is_active=True,
        is_verified=True,
        subscription_status__in=['active', 'trial'],
        latitude__isnull=False,
        longitude__isnull=False,
    )
    shops_with_distance = [(b, b.distance_from_km(lat_f, lng_f)) for b in qs]
    shops_with_distance = [(b, d) for b, d in shops_with_distance if d is not None and d <= radius_km]
    shops_with_distance.sort(key=lambda x: (x[1], x[0].id))
    data = [_shop_public_item(b, d) for b, d in shops_with_distance]
    return Response({'results': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def public_detail(request, pk):
    """
    GET /api/barbershops/<id>/public/
    Public profile: name, address, opening_hours, services (active), staff (barbers), logo.
    """
    barbershop = Barbershop.objects.filter(
        pk=pk,
        is_active=True,
        is_verified=True,
        subscription_status__in=['active', 'trial'],
    ).first()
    if not barbershop:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    try:
        from services.models import Service
    except ImportError:
        Service = None
    services = []
    if Service:
        services = list(
            Service.objects.filter(barbershop=barbershop, is_active=True).values(
                'id', 'name', 'description', 'price', 'duration', 'category', 'image_url'
            )
        )
        for s in services:
            s['price'] = float(s['price'])
    staff = list(
        BarbershopStaff.objects.filter(barbershop=barbershop, is_active=True)
        .select_related('user')
        .values('id', 'role', 'user_id', 'user__name', 'user__email')
    )
    staff_list = [{'id': s['id'], 'role': s['role'], 'name': s['user__name'], 'email': s['user__email']} for s in staff]
    payload = {
        'id': barbershop.id,
        'name': barbershop.name,
        'slug': barbershop.slug,
        'address': barbershop.address,
        'city': barbershop.city,
        'country': barbershop.country,
        'phone': barbershop.phone,
        'email': barbershop.email,
        'opening_hours': barbershop.opening_hours,
        'logo_url': barbershop.logo_url,
        'services': services,
        'staff': staff_list,
        'average_rating': barbershop.average_rating,
        'total_reviews': barbershop.total_reviews,
    }
    if barbershop.latitude is not None and barbershop.longitude is not None:
        payload['latitude'] = float(barbershop.latitude)
        payload['longitude'] = float(barbershop.longitude)
    return Response(payload)


# ---- Staff management (owner only for list/update/remove) ----
def get_barbershop_for_staff_view(request, pk):
    """Set request.barbershop from URL pk; used by staff list endpoint."""
    barbershop = Barbershop.objects.filter(pk=pk, is_active=True).first()
    if not barbershop:
        return None, Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    request.barbershop = barbershop
    request.barbershop_id = barbershop.id
    return barbershop, None


class BarbershopStaffListView(APIView):
    """GET /api/barbershops/<id>/staff/ - List staff (Owner only)."""
    permission_classes = [IsAuthenticated, IsBarbershopOwner]

    def get(self, request, pk):
        barbershop, err = get_barbershop_for_staff_view(request, pk)
        if err:
            return err
        if not IsBarbershopOwner().has_permission(request, self):
            return Response({'detail': 'Only the owner can list staff.'}, status=status.HTTP_403_FORBIDDEN)
        staff = BarbershopStaff.objects.filter(barbershop=barbershop, is_active=True).select_related('user')
        serializer = BarbershopStaffSerializer(staff, many=True)
        return Response({'success': True, 'staff': serializer.data})


class BarbershopStaffDetailView(APIView):
    """PATCH /api/barbershops/staff/<id>/ - Update role. DELETE - Remove staff (is_active=False). Owner only."""
    permission_classes = [IsAuthenticated, IsBarbershopOwner]

    def get_staff_and_barbershop(self, request, pk):
        staff = BarbershopStaff.objects.filter(pk=pk).select_related('barbershop').first()
        if not staff:
            return None, None, Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        request.barbershop = staff.barbershop
        request.barbershop_id = staff.barbershop_id
        if not IsBarbershopOwner().has_permission(request, self):
            return None, None, Response({'detail': 'Only the owner can update or remove staff.'}, status=status.HTTP_403_FORBIDDEN)
        return staff, staff.barbershop, None

    def patch(self, request, pk):
        staff, barbershop, err = self.get_staff_and_barbershop(request, pk)
        if err:
            return err
        role = request.data.get('role')
        if role not in ('Barber', 'Admin'):
            return Response({'detail': 'role must be Barber or Admin.'}, status=status.HTTP_400_BAD_REQUEST)
        staff.role = role
        staff.save(update_fields=['role'])
        serializer = BarbershopStaffSerializer(staff)
        return Response({'success': True, 'staff': serializer.data})

    def delete(self, request, pk):
        staff, barbershop, err = self.get_staff_and_barbershop(request, pk)
        if err:
            return err
        staff.is_active = False
        staff.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---- Reviews (public list + rating summary; create/update/delete under /api/reviews/) ----
class ReviewPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([AllowAny])
def barbershop_reviews_list(request, pk):
    """
    GET /api/barbershops/<id>/reviews/
    Public list of approved reviews (paginated). Query: verified=true for verified only; sort=newest|highest|lowest.
    """
    barbershop = Barbershop.objects.filter(
        pk=pk, is_active=True, is_verified=True,
        subscription_status__in=['active', 'trial'],
    ).first()
    if not barbershop:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    qs = Review.objects.filter(barbershop=barbershop, is_approved=True).select_related('customer', 'barber')
    if request.query_params.get('verified') == 'true':
        qs = qs.filter(is_verified=True)
    sort = request.query_params.get('sort', 'newest')
    if sort == 'highest':
        qs = qs.order_by('-rating', '-created_at')
    elif sort == 'lowest':
        qs = qs.order_by('rating', '-created_at')
    else:
        qs = qs.order_by('-created_at')
    paginator = ReviewPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        serializer = ReviewSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response({'results': serializer.data})
    serializer = ReviewSerializer(qs[:20], many=True, context={'request': request})
    return Response({'results': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def barbershop_rating_summary(request, pk):
    """
    GET /api/barbershops/<id>/rating-summary/
    Public aggregation: average_rating, total_reviews, rating_breakdown.
    """
    barbershop = Barbershop.objects.filter(
        pk=pk, is_active=True, is_verified=True,
        subscription_status__in=['active', 'trial'],
    ).first()
    if not barbershop:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'average_rating': barbershop.average_rating,
        'total_reviews': barbershop.total_reviews,
        'rating_breakdown': barbershop.rating_breakdown(),
    })
