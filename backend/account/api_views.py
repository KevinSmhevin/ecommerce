from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode
from django.core.mail import EmailMessage
from django.conf import settings
from django.middleware.csrf import get_token
from payment.models import Order, OrderItem, ShippingAddress
from .token import user_tokenizer_generate
from .forms import CreateUserForm, UpdateUserForm
from payment.forms import ShippingForm
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
def api_login(request):
    """API endpoint for user login"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        if user.is_active:
            login(request, user)
            return Response({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        else:
            return Response(
                {'error': 'Account is not active. Please verify your email.'},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
def api_register(request):
    """API endpoint for user registration"""
    form = CreateUserForm(request.data)
    
    if form.is_valid():
        user = form.save()
        user.is_active = False
        user.save()
        
        # Email verification setup
        current_site = get_current_site(request)
        
        subject = 'Account verification email'
        
        message = render_to_string('account/registration/email-verification.html', { 
            'user': user,
            'domain': current_site.domain,
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': user_tokenizer_generate.make_token(user),
        })
        
        email_message = EmailMessage(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
            reply_to=['support@pokebin.app'],
        )
        email_message.send(fail_silently=False)
        
        return Response({
            'success': True,
            'message': 'Registration successful. Please check your email to verify your account.'
        })
    else:
        return Response(
            {'error': 'Registration failed', 'errors': form.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
def api_logout(request):
    """API endpoint for user logout"""
    logout(request)
    return Response({'success': True, 'message': 'Logout successful'})

@api_view(['GET'])
def api_check_auth(request):
    """API endpoint to check if user is authenticated"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
            }
        })
    else:
        return Response({'authenticated': False})

@api_view(['GET'])
def api_get_csrf_token(request):
    """API endpoint to get CSRF token"""
    token = get_token(request)
    return Response({'csrfToken': token})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_dashboard(request):
    """API endpoint for dashboard data"""
    user = request.user
    orders_count = Order.objects.filter(user=user).count()
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        },
        'orders_count': orders_count,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_track_orders(request):
    """API endpoint to get user's orders"""
    try:
        orders = Order.objects.filter(user=request.user).order_by('-date_ordered')
        orders_data = []
        for order in orders:
            order_items = OrderItem.objects.filter(order=order)
            items_data = []
            for item in order_items:
                items_data.append({
                    'product_name': item.product.title if item.product else 'N/A',
                    'quantity': item.quantity,
                    'price': str(item.price),
                    'total': str(item.quantity * item.price),
                })
            orders_data.append({
                'id': order.id,
                'full_name': order.full_name,
                'email': order.email,
                'shipping_address': order.shipping_address,
                'amount_paid': str(order.amount_paid),
                'date_ordered': order.date_ordered.isoformat(),
                'shipped': order.shipped,
                'date_shipped': order.date_shipped.isoformat() if order.date_shipped else None,
                'tracking_number': order.tracking_number,
                'courier': order.courier,
                'items': items_data,
            })
        return Response({'orders': orders_data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_profile_management(request):
    """API endpoint for profile management"""
    if request.method == 'GET':
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email,
        })
    elif request.method == 'POST':
        user = request.user
        form = UpdateUserForm(request.data, instance=user)
        if form.is_valid():
            form.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        else:
            return Response(
                {'error': 'Registration failed', 'errors': form.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_manage_shipping(request):
    """API endpoint for managing shipping address"""
    try:
        shipping = ShippingAddress.objects.get(user=request.user)
    except ShippingAddress.DoesNotExist:
        shipping = None
    
    if request.method == 'GET':
        if shipping:
            return Response({
                'full_name': shipping.full_name,
                'email': shipping.email,
                'address1': shipping.address1,
                'address2': shipping.address2,
                'city': shipping.city,
                'state': shipping.state,
                'zipcode': shipping.zipcode,
            })
        else:
            return Response({})
    
    elif request.method == 'POST':
        form = ShippingForm(request.data, instance=shipping)
        if form.is_valid():
            shipping_user = form.save(commit=False)
            shipping_user.user = request.user
            shipping_user.save()
            return Response({
                'success': True,
                'message': 'Shipping address saved successfully',
            })
        else:
            return Response(
                {'error': 'Invalid data', 'errors': form.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
def api_check_order(request):
    """API endpoint to check order by order number"""
    order_number = request.data.get('order_number')
    
    if not order_number:
        return Response(
            {'error': 'Order number is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        order = Order.objects.get(id=order_number)
        order_items = OrderItem.objects.filter(order=order)
        
        items_data = []
        for item in order_items:
            items_data.append({
                'product_name': item.product.title if item.product else 'N/A',
                'quantity': item.quantity,
                'price': str(item.price),
                'total': str(item.quantity * item.price),
            })
        
        return Response({
            'success': True,
            'order': {
                'id': order.id,
                'full_name': order.full_name,
                'email': order.email,
                'shipping_address': order.shipping_address,
                'amount_paid': str(order.amount_paid),
                'date_ordered': order.date_ordered.isoformat(),
                'shipped': order.shipped,
                'date_shipped': order.date_shipped.isoformat() if order.date_shipped else None,
                'tracking_number': order.tracking_number,
                'courier': order.courier,
                'items': items_data,
            }
        })
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Unable to find order number'},
            status=status.HTTP_400_BAD_REQUEST
        )

