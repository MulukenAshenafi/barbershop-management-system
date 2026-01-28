from django.contrib import admin
from .models import Service, Product, ProductImage, ProductReview, Order, OrderItem, Category


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'category', 'price', 'duration', 'is_active']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    raw_id_fields = ['barbershop']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'category', 'price', 'stock', 'rating', 'is_active']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    raw_id_fields = ['barbershop']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'image_url', 'created_at']
    raw_id_fields = ['product']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    raw_id_fields = ['product', 'user']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'barbershop', 'total_amount', 'order_status', 'payment_method', 'created_at']
    list_filter = ['order_status', 'payment_method', 'created_at']
    search_fields = ['user__name', 'user__email']
    raw_id_fields = ['user', 'barbershop']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'name', 'quantity', 'price']
    raw_id_fields = ['order', 'product']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']
