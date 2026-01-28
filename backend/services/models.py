from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Category(models.Model):
    """Category model for products and services."""
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name


class Service(models.Model):
    """Service model (multi-tenant)."""
    SERVICE_CATEGORIES = [
        ('Haircut', 'Haircut'),
        ('Beard Trim', 'Beard Trim'),
        ('Shave', 'Shave'),
        ('Hair Wash', 'Hair Wash'),
        ('Hair Coloring', 'Hair Coloring'),
        ('Kids Haircut', 'Kids Haircut'),
        ('Special Packages', 'Special Packages'),
    ]
    
    barbershop = models.ForeignKey(
        'barbershops.Barbershop',
        on_delete=models.CASCADE,
        related_name='services',
        null=True,  # Allow null for migration period
        blank=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    duration = models.CharField(max_length=50)  # e.g., "45 min"
    duration_minutes = models.IntegerField(null=True, blank=True)  # Parsed duration for easier querying
    category = models.CharField(max_length=50, choices=SERVICE_CATEGORIES)
    image_url = models.URLField(blank=True, null=True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'services'
        indexes = [
            models.Index(fields=['barbershop']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.barbershop.name if self.barbershop else 'No Shop'}"
    
    @property
    def image(self):
        """Return image in format compatible with frontend."""
        if self.image_url:
            return [{
                'public_id': self.image_public_id or '',
                'url': self.image_url
            }]
        return []
    
    def save(self, *args, **kwargs):
        """Parse duration string to minutes."""
        if self.duration and not self.duration_minutes:
            import re
            match = re.match(r'(\d+)\s*min', self.duration, re.IGNORECASE)
            if match:
                self.duration_minutes = int(match.group(1))
        super().save(*args, **kwargs)


class Product(models.Model):
    """Product model (multi-tenant)."""
    barbershop = models.ForeignKey(
        'barbershops.Barbershop',
        on_delete=models.CASCADE,
        related_name='products',
        null=True,  # Allow null for migration period
        blank=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    stock = models.IntegerField(validators=[MinValueValidator(0)])
    category = models.CharField(max_length=100)  # String reference (can be linked to Category later)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    num_reviews = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['barbershop']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.barbershop.name if self.barbershop else 'No Shop'}"


class ProductImage(models.Model):
    """Product images (separate model for multiple images)."""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField()
    public_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_images'
    
    def __str__(self):
        return f"{self.product.name} - Image"


class ProductReview(models.Model):
    """Product reviews."""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='product_reviews'
    )
    rating = models.IntegerField(
    validators=[MinValueValidator(1), MaxValueValidator(5)]
)

    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_reviews'
        unique_together = ['product', 'user']  # One review per user per product
    
    def __str__(self):
        return f"{self.user.name} - {self.product.name} ({self.rating} stars)"


class Order(models.Model):
    """Order model (multi-tenant)."""
    PAYMENT_METHODS = [
        ('COD', 'Cash on Delivery'),
        ('ONLINE', 'Online Payment'),
    ]
    
    ORDER_STATUS = [
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
    ]
    
    barbershop = models.ForeignKey(
        'barbershops.Barbershop',
        on_delete=models.CASCADE,
        related_name='orders',
        null=True,  # Allow null for migration period
        blank=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    
    # Shipping info
    shipping_address = models.CharField(max_length=255)
    shipping_city = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100)
    
    # Payment
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='COD')
    payment_info_id = models.CharField(max_length=255, blank=True, null=True)
    payment_info_status = models.CharField(max_length=50, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Pricing
    item_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_charges = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS, default='processing')
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['barbershop']),
            models.Index(fields=['user']),
            models.Index(fields=['order_status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Order #{self.id} - {self.user.name}"


class OrderItem(models.Model):
    """Order items."""
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    image = models.URLField()
    
    class Meta:
        db_table = 'order_items'
    
    def __str__(self):
        return f"{self.name} x{self.quantity} - Order #{self.order.id}"
