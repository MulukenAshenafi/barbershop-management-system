"""Serializers for barbershop registration, listing, public discovery, staff, and reviews."""
import json
from rest_framework import serializers
from django.utils import timezone
from .models import Barbershop, BarbershopStaff, StaffInvitation, Review
from .models import validate_opening_hours


class BarbershopRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for POST /api/barbershops/register/."""
    opening_hours = serializers.JSONField(required=False, default=dict)

    def to_internal_value(self, data):
        if data.get('opening_hours') and isinstance(data['opening_hours'], str):
            try:
                data = data.copy()
                data['opening_hours'] = json.loads(data['opening_hours'])
            except (TypeError, ValueError):
                pass
        return super().to_internal_value(data)

    class Meta:
        model = Barbershop
        fields = [
            'id', 'name', 'slug', 'address', 'city', 'country',
            'phone', 'email', 'opening_hours', 'logo_url', 'logo_public_id',
            'latitude', 'longitude',
            'subdomain', 'owner', 'is_verified', 'subscription_status',
        ]
        read_only_fields = ['id', 'subdomain', 'owner', 'is_verified', 'subscription_status']
        extra_kwargs = {
            'name': {'required': True},
            'slug': {'required': False},  # auto-generated from name if not provided
            'address': {'required': True},
            'city': {'required': True},
            'country': {'required': True},
            'phone': {'required': True},
            'email': {'required': True},
        }

    def validate_opening_hours(self, value):
        if value:
            validate_opening_hours(value)
        return value or {}

    def validate_slug(self, value):
        if value:
            value = value.strip().lower().replace(' ', '-')
            for c in value:
                if c not in 'abcdefghijklmnopqrstuvwxyz0-9-':
                    value = value.replace(c, '')
            value = '-'.join(filter(None, value.split('-')))
        return value or None

    def update(self, instance, validated_data):
        validated_data.pop('slug', None)
        validated_data.pop('subdomain', None)
        validated_data.pop('owner', None)
        return super().update(instance, validated_data)

    def create(self, validated_data):
        from .utils import generate_unique_subdomain
        user = self.context['request'].user
        name = validated_data['name']
        slug = validated_data.get('slug')
        if not slug:
            slug = name.lower().replace(' ', '-')
            for c in slug:
                if c not in 'abcdefghijklmnopqrstuvwxyz0-9-':
                    slug = slug.replace(c, '')
            slug = '-'.join(filter(None, slug.split('-')))
            if not slug:
                slug = 'shop'
        # Ensure slug uniqueness
        base_slug = slug
        n = 1
        while Barbershop.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{n}'
            n += 1
        validated_data['slug'] = slug
        validated_data['owner'] = user
        validated_data['subdomain'] = generate_unique_subdomain(slug)
        barbershop = super().create(validated_data)
        BarbershopStaff.objects.create(
            barbershop=barbershop,
            user=user,
            role='Admin',
            is_active=True,
        )
        return barbershop


class BarbershopStaffSummarySerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)

    class Meta:
        model = BarbershopStaff
        fields = ['id', 'role', 'is_active', 'joined_at']


class BarbershopListSerializer(serializers.ModelSerializer):
    """Serializer for GET /api/barbershops/my-shops/."""
    owner_role = serializers.SerializerMethodField()

    class Meta:
        model = Barbershop
        fields = [
            'id', 'name', 'slug', 'subdomain', 'address', 'city', 'country',
            'phone', 'email', 'logo_url', 'is_active', 'is_verified',
            'subscription_status', 'owner_role',
        ]

    def get_owner_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        staff = BarbershopStaff.objects.filter(
            barbershop=obj, user=request.user, is_active=True
        ).first()
        if staff:
            return staff.role
        if obj.owner_id == request.user.id:
            return 'Admin'
        return None


class StaffInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffInvitation
        fields = ['id', 'email', 'phone', 'role', 'token', 'expires_at', 'is_used', 'created_at']


class BarbershopStaffSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = BarbershopStaff
        fields = ['id', 'user', 'user_name', 'user_email', 'role', 'is_active', 'joined_at', 'is_owner']

    def get_is_owner(self, obj):
        return obj.barbershop.owner_id == obj.user_id


class ReviewSerializer(serializers.ModelSerializer):
    """Read serializer for reviews (list/detail)."""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    barber_id = serializers.IntegerField(source='barber_id', read_only=True, allow_null=True)

    class Meta:
        model = Review
        fields = [
            'id', 'rating', 'comment', 'customer_name', 'customer_avatar',
            'is_verified', 'created_at', 'is_editable', 'barber_id',
        ]
        read_only_fields = ['is_verified', 'created_at']

    def get_customer_avatar(self, obj):
        url = getattr(obj.customer, 'profile_pic_url', None) or ''
        if not url and hasattr(obj.customer, 'profile_pic'):
            p = obj.customer.profile_pic
            if isinstance(p, list) and p and isinstance(p[0], dict):
                url = p[0].get('url', '') or ''
        return url or None

    def get_is_editable(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.customer_id != request.user.id:
            return False
        delta = timezone.now() - obj.created_at
        return delta.days < 1


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Create review (requires booking_id or order_id)."""
    booking_id = serializers.IntegerField(required=False, allow_null=True)
    order_id = serializers.IntegerField(required=False, allow_null=True)
    barber_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Review
        fields = ['rating', 'comment', 'booking_id', 'order_id', 'barber_id']

    def validate(self, data):
        from bookings.models import Booking
        from services.models import Order
        request = self.context.get('request')
        user = request.user if request else None
        if not user:
            raise serializers.ValidationError('Authentication required.')
        booking_id = data.get('booking_id')
        order_id = data.get('order_id')
        if not booking_id and not order_id:
            raise serializers.ValidationError('Review must be linked to a booking or order.')
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id, customer=user)
            except Booking.DoesNotExist:
                raise serializers.ValidationError('Invalid booking.')
            if booking.payment_status not in ('Online Paid', 'Online Pending'):
                raise serializers.ValidationError('Can only review paid bookings.')
            if Review.objects.filter(booking=booking).exists():
                raise serializers.ValidationError('You have already reviewed this booking.')
            data['barbershop'] = booking.barbershop
            data['booking'] = booking
            data['customer'] = user
            if not data.get('barber_id'):
                staff = BarbershopStaff.objects.filter(
                    barbershop=booking.barbershop, user=booking.barber
                ).first()
                data['barber'] = staff
            else:
                staff = BarbershopStaff.objects.filter(
                    id=data['barber_id'], barbershop=booking.barbershop
                ).first()
                data['barber'] = staff
        if order_id:
            try:
                order = Order.objects.get(id=order_id, user=user)
            except Order.DoesNotExist:
                raise serializers.ValidationError('Invalid order.')
            if order.order_status not in ('delivered', 'Delivered'):
                raise serializers.ValidationError('Can only review delivered orders.')
            if Review.objects.filter(order=order).exists():
                raise serializers.ValidationError('You have already reviewed this order.')
            data['barbershop'] = order.barbershop
            data['order'] = order
            data['customer'] = user
            data['barber'] = None
        data.pop('booking_id', None)
        data.pop('order_id', None)
        data.pop('barber_id', None)
        return data

    def create(self, validated_data):
        return Review.objects.create(**validated_data)
