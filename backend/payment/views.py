from django.shortcuts import render

from . models import ShippingAddress, Order, OrderItem

from cart.cart import Cart

from store.models import Product

from django.http import JsonResponse

from django.core.mail import EmailMessage

from django.conf import settings

def checkout(request):
    
    #users with accounts - prefill the form
    
    if request.user.is_authenticated:
        
        try:
            
            shipping_address = ShippingAddress.objects.get(user=request.user.id)
            
            context = {'shipping': shipping_address}
            
            return render(request, 'payment/checkout.html', context=context)
        
        except:
            # authenticated users with no shipping information

            return render(request, 'payment/checkout.html')
    
    return render(request, 'payment/checkout.html')

def complete_order(request):
    
    if request.POST.get('action') == 'post':
        
        name = request.POST.get('name')
        email = request.POST.get('email')
        
        address1 = request.POST.get('address1')
        address2 = request.POST.get('address2')
        
        city = request.POST.get('city')
        
        state = request.POST.get('state')
        zipcode = request.POST.get('zipcode')
        
        shipping_address = (address1 + "\n" + address2 + "\n" +
                            city + "\n" + state + "\n" + zipcode)

        # shopping cart info
        
        cart = Cart(request)
        
        # Get the total price of items 
        total_cost = cart.get_total()
        
        '''
        
            Order variations
            
            1) Create order -> Account users WITH + WITHOUT shipping information
            
            2) Create order -> Guest users without an account
        
        '''
        product_list = []
        if request.user.is_authenticated:
            
            order = Order.objects.create(full_name=name, email=email, shipping_address=shipping_address, 
                                         amount_paid=total_cost, user=request.user)
                        
            for item in cart: 
                
                OrderItem.objects.create(order_id=order.pk, product=item['product'], quantity=item['qty'],
                                         price=item['price'], user=request.user)
                update_catalog = Product.objects.get(pk=item['product_id'])
                update_catalog.stock -= 1
                update_catalog.units_sold += 1
                update_catalog.save()
                product_list.append(item['product'])
        else: # guest users
            
            order = Order.objects.create(full_name=name, email=email, shipping_address=shipping_address, 
                                         amount_paid=total_cost)
            
            for item in cart: 
                
                OrderItem.objects.create(order_id=order.pk, product=item['product'], quantity=item['qty'],
                                         price=item['price'])
                
                update_catalog = Product.objects.get(pk=item['product_id'])
                update_catalog.stock -= 1
                update_catalog.units_sold += 1
                update_catalog.save()
                product_list.append(item['product'])
                
        
        all_products = product_list
        # email order
        
        email_message = EmailMessage(
            subject='Order received',
            body='Hi! ' + '\n\n' + 'Thank you for placing your order. Your order numer is : ' + str(order.pk) + '\n\n' + 
                    'Please see your order below:' + '\n\n' + str(all_products) + '\n\n' + 'Total paid: $' +
                    str(cart.get_total()),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
            reply_to=['support@pokebin.app'],
        )
        email_message.send(fail_silently=False)
                
            
            
        order_success = True
        
        response = JsonResponse({'success': order_success})
        
        return response


def payment_success(request):
    
    # clear shopping cart 
    for key in list(request.session.keys()):
        
        if key == 'session_key':
            
            del request.session[key]
            
    
    return render(request, 'payment/payment-success.html')

def payment_failed(request):
    
    return render(request, 'payment/payment-failed.html')