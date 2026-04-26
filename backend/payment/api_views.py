from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Order, OrderItem, ShippingAddress
from store.models import Product
from django.core.mail import EmailMessage
from django.conf import settings

@api_view(['POST'])
@permission_classes([AllowAny])
def api_complete_order(request):
    """API endpoint to complete order from React cart"""
    try:
        cart_items = request.data.get('cart_items', [])
        shipping_data = request.data.get('shipping', {})

        if not cart_items:
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build shipping address string
        address_parts = [
            shipping_data.get('address1', ''),
            shipping_data.get('address2', ''),
            shipping_data.get('city', ''),
            shipping_data.get('state', ''),
            shipping_data.get('zipcode', ''),
        ]
        shipping_address = '\n'.join(filter(None, address_parts))

        # Resolve products and compute total using database prices — never trust client-supplied prices
        resolved_items = []
        total_cost = Decimal('0.00')
        for item in cart_items:
            try:
                product = Product.objects.get(id=item.get('id'), stock__gt=0)
                quantity = int(item.get('quantity', 1))
                if quantity < 1:
                    continue
                total_cost += product.price * quantity
                resolved_items.append((product, quantity))
            except Product.DoesNotExist:
                continue

        if not resolved_items:
            return Response(
                {'error': 'No valid products in cart'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create order
        order = Order.objects.create(
            full_name=shipping_data.get('full_name', ''),
            email=shipping_data.get('email', ''),
            shipping_address=shipping_address,
            amount_paid=total_cost,
            user=request.user if request.user.is_authenticated else None
        )

        # Create order items and update product stock
        product_list = []
        for product, quantity in resolved_items:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price,
                user=request.user if request.user.is_authenticated else None
            )
            product.stock -= quantity
            product.units_sold += quantity
            product.save()
            product_list.append(product.title)

        # Send email
        try:
            email_message = EmailMessage(
                subject='Order received',
                body=f'Hi!\n\nThank you for placing your order. Your order number is: {order.id}\n\n'
                     f'Please see your order below:\n\n{", ".join(product_list)}\n\n'
                     f'Total paid: ${total_cost:.2f}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[shipping_data.get('email', '')],
                reply_to=['support@pokebin.app'],
            )
            email_message.send(fail_silently=False)
        except Exception as e:
            print(f'Error sending email: {e}')

        return Response({
            'success': True,
            'order_id': order.id,
            'message': 'Order completed successfully'
        })

    except Exception as e:
        return Response(
            {'error': f'Failed to complete order: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )




