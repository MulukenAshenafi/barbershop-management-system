from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.cache import cache
from django.utils.decorators import method_decorator
from barbershops.utils import filter_by_barbershop, get_barbershop_from_request
from .cache_utils import cached_view
import cloudinary
import cloudinary.uploader
from .models import Service, Product, ProductImage, ProductReview, Order, OrderItem, Category
from .serializers import (
    ServiceSerializer, ProductSerializer, OrderSerializer,
    OrderItemSerializer, CategorySerializer, ProductReviewSerializer
)
from accounts.permissions import IsAdminUser
import re


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for service management."""
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]  # Public access for listing
    
    def get_permissions(self):
        """Override permissions for create/update/delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_image', 'delete_image']:
            return [IsAuthenticated(), IsAdminUser()]
        return [AllowAny()]
    
    @action(detail=False, methods=['get'])
    def get_all(self, request):
        """Get all services (matching original API)."""
        services = self.get_queryset()
        formatted_services = []
        for service in services:
            formatted_services.append({
                '_id': str(service.id),
                'name': service.name,
                'description': service.description,
                'price': float(service.price),
                'duration': service.duration,
                'category': service.category,
                'imageUrl': service.image_url or '',
            })
        
        return Response({
            'success': True,
            'message': 'All services fetched successfully',
            'services': formatted_services
        })
    
    @action(detail=True, methods=['get'])
    def get_single(self, request, pk=None):
        """Get single service."""
        service = get_object_or_404(Service, pk=pk)
        serializer = self.get_serializer(service)
        return Response({
            'success': True,
            'message': 'Service found',
            'service': serializer.data
        })
    
    def create(self, request):
        """Create service (admin only)."""
        if not request.FILES.get('file'):
            return Response({
                'success': False,
                'message': 'Please provide a service image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get barbershop from request context
        barbershop = getattr(request, 'barbershop', None)
        if not barbershop:
            return Response({
                'success': False,
                'message': 'Barbershop context required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Upload to Cloudinary
        file = request.FILES['file']
        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder=f'services/{barbershop.id}'
            )
            
            service_data = {
                'barbershop': barbershop,
                'name': request.data.get('name'),
                'description': request.data.get('description'),
                'price': request.data.get('price'),
                'category': request.data.get('category'),
                'duration': request.data.get('duration'),
                'image_url': upload_result['secure_url'],
                'image_public_id': upload_result['public_id'],
            }
            
            service = Service.objects.create(**service_data)
            
            # Invalidate cache
            cache.delete_pattern('services_*')
            
            serializer = self.get_serializer(service)
            
            return Response({
                'success': True,
                'message': 'Service created successfully',
                'service': serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error uploading image',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, pk=None):
        """Update service details."""
        service = get_object_or_404(Service, pk=pk)
        data = request.data
        
        if 'name' in data:
            service.name = data['name']
        if 'description' in data:
            service.description = data['description']
        if 'price' in data:
            service.price = data['price']
        if 'category' in data:
            service.category = data['category']
        
        service.save()
        
        return Response({
            'success': True,
            'message': 'Service details updated successfully'
        })
    
    @action(detail=True, methods=['put'])
    def update_image(self, request, pk=None):
        """Update service image."""
        service = get_object_or_404(Service, pk=pk)
        
        if 'image' not in request.data:
            return Response({
                'success': False,
                'message': 'Please provide a new image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Upload new image
            upload_result = cloudinary.uploader.upload(
                request.data['image'],
                folder='services'
            )
            
            service.image_url = upload_result['secure_url']
            service.image_public_id = upload_result['public_id']
            service.save()
            
            return Response({
                'success': True,
                'message': 'Service image updated successfully'
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error updating image',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def delete_image(self, request, pk=None):
        """Delete service image."""
        service = get_object_or_404(Service, pk=pk)
        
        if service.image_public_id:
            try:
                cloudinary.uploader.destroy(service.image_public_id)
            except:
                pass
        
        service.image_url = None
        service.image_public_id = None
        service.save()
        
        return Response({
            'success': True,
            'message': 'Service image deleted successfully'
        })
    
    def destroy(self, request, pk=None):
        """Delete service."""
        service = get_object_or_404(Service, pk=pk)
        
        # Delete images from Cloudinary
        if service.image_public_id:
            try:
                cloudinary.uploader.destroy(service.image_public_id)
            except:
                pass
        
        service.delete()
        
        return Response({
            'success': True,
            'message': 'Service deleted successfully'
        })


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for product management."""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """Override permissions for create/update/delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_image', 'delete_image', 'review']:
            if self.action == 'review':
                return [IsAuthenticated()]
            return [IsAuthenticated(), IsAdminUser()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Filter products by keyword, category, and barbershop (multi-tenant)."""
        queryset = super().get_queryset()
        barbershop_id = get_barbershop_from_request(self.request)
        queryset = filter_by_barbershop(queryset, barbershop_id)
        
        keyword = self.request.query_params.get('keyword', '')
        category = self.request.query_params.get('category', '')
        
        if keyword:
            queryset = queryset.filter(name__icontains=keyword)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def get_all(self, request):
        """Get all products."""
        products = self.get_queryset()
        serializer = self.get_serializer(products, many=True)
        return Response({
            'success': True,
            'message': 'all products fetched successfully',
            'totalProducts': products.count(),
            'products': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def top(self, request):
        """Get top 3 products by rating."""
        products = Product.objects.filter(is_active=True).order_by('-rating')[:3]
        serializer = self.get_serializer(products, many=True)
        return Response({
            'success': True,
            'message': 'Top 3 products fetched successfully',
            'products': serializer.data
        })
    
    def retrieve(self, request, pk=None):
        """Get single product."""
        product = get_object_or_404(Product, pk=pk)
        serializer = self.get_serializer(product)
        return Response({
            'success': True,
            'message': 'product found',
            'product': serializer.data
        })
    
    def create(self, request):
        """Create product."""
        if not request.FILES.get('file'):
            return Response({
                'success': False,
                'message': 'Please provide product images?'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get barbershop from request context
        barbershop = getattr(request, 'barbershop', None)
        if not barbershop:
            return Response({
                'success': False,
                'message': 'Barbershop context required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file = request.FILES['file']
            upload_result = cloudinary.uploader.upload(
                file,
                folder=f'products/{barbershop.id}'
            )
            
            product = Product.objects.create(
                barbershop=barbershop,
                name=request.data.get('name'),
                description=request.data.get('description'),
                price=request.data.get('price'),
                category=request.data.get('category'),
                stock=request.data.get('stock'),
            )
            
            ProductImage.objects.create(
                product=product,
                image_url=upload_result['secure_url'],
                public_id=upload_result['public_id']
            )
            
            # Invalidate cache
            from .cache_utils import invalidate_cache_pattern
            invalidate_cache_pattern('products_*')
            
            return Response({
                'success': True,
                'message': 'product Created Successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error creating product',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, pk=None):
        """Update product."""
        product = get_object_or_404(Product, pk=pk)
        data = request.data
        
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = data['price']
        if 'stock' in data:
            product.stock = data['stock']
        if 'category' in data:
            product.category = data['category']
        
        product.save()
        
        return Response({
            'success': True,
            'message': 'product Details Updated Successfully'
        })
    
    @action(detail=True, methods=['put'])
    def update_image(self, request, pk=None):
        """Update product image."""
        product = get_object_or_404(Product, pk=pk)
        
        if not request.FILES.get('file'):
            return Response({
                'success': False,
                'message': 'product image not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file = request.FILES['file']
            upload_result = cloudinary.uploader.upload(file)
            
            ProductImage.objects.create(
                product=product,
                image_url=upload_result['secure_url'],
                public_id=upload_result['public_id']
            )
            
            return Response({
                'success': True,
                'message': 'product Image Updated Successfully'
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error updating image',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def delete_image(self, request, pk=None):
        """Delete product image."""
        product = get_object_or_404(Product, pk=pk)
        image_id = request.query_params.get('id')
        
        if not image_id:
            return Response({
                'success': False,
                'message': 'product image not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = ProductImage.objects.get(id=image_id, product=product)
            if image.public_id:
                cloudinary.uploader.destroy(image.public_id)
            image.delete()
            
            return Response({
                'success': True,
                'message': 'product Image Deleted Successfully'
            })
        except ProductImage.DoesNotExist:
            return Response({
                'success': False,
                'message': 'image not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, pk=None):
        """Delete product."""
        product = get_object_or_404(Product, pk=pk)
        
        # Delete all images
        for image in product.images.all():
            if image.public_id:
                try:
                    cloudinary.uploader.destroy(image.public_id)
                except:
                    pass
        
        product.delete()
        
        return Response({
            'success': True,
            'message': 'Product Deleted Successfully'
        })
    
    @action(detail=True, methods=['put'])
    def review(self, request, pk=None):
        """Add product review."""
        product = get_object_or_404(Product, pk=pk)
        user = request.user
        
        # Check if already reviewed
        if ProductReview.objects.filter(product=product, user=user).exists():
            return Response({
                'success': False,
                'message': 'product already reviewed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rating = int(request.data.get('rating', 0))
        comment = request.data.get('comment', '')
        
        ProductReview.objects.create(
            product=product,
            user=user,
            rating=rating,
            comment=comment
        )
        
        # Update product rating
        reviews = product.reviews.all()
        product.num_reviews = reviews.count()
        if reviews.count() > 0:
            product.rating = sum(r.rating for r in reviews) / reviews.count()
        product.save()
        
        return Response({
            'success': True,
            'message': 'Review Added Successfully'
        })


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter orders by user role and barbershop (multi-tenant)."""
        user = self.request.user
        barbershop_id = get_barbershop_from_request(self.request)
        
        if user.role == 'Admin':
            queryset = Order.objects.all()
        else:
            queryset = Order.objects.filter(user=user)
        
        return filter_by_barbershop(queryset, barbershop_id)
    
    def create(self, request):
        """Create order."""
        data = request.data
        shipping_info = data.get('shippingInfo', {})
        order_items = data.get('orderItems', [])
        
        # Get barbershop from request context
        barbershop = getattr(request, 'barbershop', None)
        
        order = Order.objects.create(
            barbershop=barbershop,
            user=request.user,
            shipping_address=shipping_info.get('address', ''),
            shipping_city=shipping_info.get('city', ''),
            shipping_country=shipping_info.get('country', ''),
            payment_method=data.get('paymentMethod', 'COD'),
            payment_info_id=data.get('paymentInfo', {}).get('id', ''),
            payment_info_status=data.get('paymentInfo', {}).get('status', ''),
            item_price=float(data.get('itemPrice', 0)),
            tax=float(data.get('tax', 0)),
            shipping_charges=float(data.get('shippingCharges', 0)),
            total_amount=float(data.get('totalAmount', 0)),
        )
        
        # Create order items and update stock
        for item in order_items:
            OrderItem.objects.create(
                order=order,
                product_id=item['product'],
                name=item['name'],
                price=float(item['price']),
                quantity=int(item['quantity']),
                image=item['image']
            )
            
            # Update stock
            product = Product.objects.get(id=item['product'])
            product.stock -= int(item['quantity'])
            product.save()
        
        return Response({
            'success': True,
            'message': 'Order Placed Successfully'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get user's orders."""
        orders = Order.objects.filter(user=request.user)
        serializer = self.get_serializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'Your Order data',
            'totalOrder': orders.count(),
            'orders': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def get_single(self, request, pk=None):
        """Get single order details."""
        order = get_object_or_404(Order, pk=pk, user=request.user)
        serializer = self.get_serializer(order)
        return Response({
            'success': True,
            'message': 'Your Order fetched',
            'order': serializer.data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def admin_get_all_orders(self, request):
        """Get all orders (admin only)."""
        orders = Order.objects.all()
        serializer = self.get_serializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'All Orders Data',
            'totalOrders': orders.count(),
            'orders': serializer.data
        })
    
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsAdminUser])
    def admin_change_status(self, request, pk=None):
        """Change order status (admin only)."""
        order = get_object_or_404(Order, pk=pk)
        
        if order.order_status == 'processing':
            order.order_status = 'shipped'
        elif order.order_status == 'shipped':
            order.order_status = 'delivered'
            from django.utils import timezone
            order.delivered_at = timezone.now()
        else:
            return Response({
                'success': False,
                'message': 'order already delivered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order.save()
        
        return Response({
            'success': True,
            'message': 'order status updated'
        })


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for category management."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """Override permissions for create/update/delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [AllowAny()]
    
    @action(detail=False, methods=['get'])
    def get_all(self, request):
        """Get all categories."""
        categories = self.get_queryset()
        serializer = self.get_serializer(categories, many=True)
        return Response({
            'success': True,
            'message': 'Categories Fetched Successfully!',
            'totalCat': categories.count(),
            'categories': serializer.data
        })
