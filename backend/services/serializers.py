from rest_framework import serializers
from .models import Service, Product, ProductImage, ProductReview, Order, OrderItem, Category


class ServiceSerializer(serializers.ModelSerializer):
    """Service serializer."""
    image = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = [
            'name', 'description', 'price', 'duration',
            'category', 'image', 'imageUrl', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
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
            'name', 'description', 'price', 'stock', 'category',
            'images', 'rating', 'num_reviews', 'reviews', 'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'num_reviews', 'created_at', 'updated_at']
    
    def get_images(self, obj):
        return [{'public_id': img.public_id, 'url': img.image_url} for img in obj.images.all()]
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        return data


class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer (snake_case; CamelCaseJSONRenderer handles response)."""
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'price', 'quantity', 'image', 'product']


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer. Uses model field names; CamelCase renderer/parser handle frontend."""
    order_items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'shipping_address', 'shipping_city', 'shipping_country',
            'order_items', 'payment_method', 'payment_info_id', 'payment_info_status',
            'paid_at', 'item_price', 'tax', 'shipping_charges', 'total_amount',
            'order_status', 'delivered_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        return data


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer."""
    
    class Meta:
        model = Category
        fields = ['name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Convert id to _id for frontend compatibility."""
        data = super().to_representation(instance)
        data['_id'] = str(instance.id)
        return data
