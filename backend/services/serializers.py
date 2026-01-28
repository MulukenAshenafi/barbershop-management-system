from rest_framework import serializers
from .models import Service, Product, ProductImage, ProductReview, Order, OrderItem, Category


class ServiceSerializer(serializers.ModelSerializer):
    """Service serializer."""
    image = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = [
            '_id', 'name', 'description', 'price', 'duration',
            'category', 'image', 'imageUrl', 'created_at', 'updated_at'
        ]
        read_only_fields = ['_id', 'created_at', 'updated_at']
    
    def get_image(self, obj):
        return obj.image
    
    def get_imageUrl(self, obj):
        return obj.image_url if obj.image_url else ''
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        return data


class ProductImageSerializer(serializers.ModelSerializer):
    """Product image serializer."""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'public_id']


class ProductReviewSerializer(serializers.ModelSerializer):
    """Product review serializer."""
    name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = ['id', 'name', 'rating', 'comment', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer."""
    images = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            '_id', 'name', 'description', 'price', 'stock', 'category',
            'images', 'rating', 'num_reviews', 'reviews', 'created_at', 'updated_at'
        ]
        read_only_fields = ['_id', 'rating', 'num_reviews', 'created_at', 'updated_at']
    
    def get_images(self, obj):
        return [{'public_id': img.public_id, 'url': img.image_url} for img in obj.images.all()]
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        return data


class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer."""
    
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'price', 'quantity', 'image', 'product']


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer."""
    orderItems = OrderItemSerializer(source='order_items', many=True, read_only=True)
    shippingInfo = serializers.SerializerMethodField()
    paymentInfo = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            '_id', 'user', 'shippingInfo', 'orderItems', 'paymentMethod',
            'paymentInfo', 'paidAt', 'itemPrice', 'tax', 'shippingCharges',
            'totalAmount', 'orderStatus', 'deliveredAt', 'created_at', 'updated_at'
        ]
        read_only_fields = ['_id', 'created_at', 'updated_at']
    
    def get_shippingInfo(self, obj):
        return {
            'address': obj.shipping_address,
            'city': obj.shipping_city,
            'country': obj.shipping_country
        }
    
    def get_paymentInfo(self, obj):
        return {
            'id': obj.payment_info_id or '',
            'status': obj.payment_info_status or ''
        }
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        data['paidAt'] = instance.paid_at.isoformat() if instance.paid_at else None
        data['deliveredAt'] = instance.delivered_at.isoformat() if instance.delivered_at else None
        return data


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer."""
    
    class Meta:
        model = Category
        fields = ['_id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['_id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        return data
