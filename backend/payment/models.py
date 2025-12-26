from django.db import models

from django.contrib.auth.models import User

from store.models import Product

from django.db.models.signals import pre_save

from django.dispatch import receiver 

import datetime
from django.utils import timezone

from django.core.mail import send_mail

from django.conf import settings

class ShippingAddress(models.Model):
    
    full_name = models.CharField(max_length=300)
    
    email = models.EmailField(max_length=255)
    
    address1 = models.CharField(max_length=300)
    
    address2 = models.CharField(max_length=300, blank=True, null=True)
    
    city = models.CharField(max_length=255)
    
    # Optional
    
    state = models.CharField(max_length=255, null=True, blank=True)
    
    zipcode = models.CharField(max_length=255, null=True, blank=True)
    
    #FK
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    
    class Meta:
        
        verbose_name_plural = 'Shipping Address'
        
    
    def __str__(self):
        
        return 'Shipping Address - ' + str(self.id)
    

class Order(models.Model):
    
    full_name = models.CharField(max_length=300)
    
    email = models.EmailField(max_length=255)
    
    shipping_address = models.TextField(max_length=10000)
    
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2)
    
    date_ordered = models.DateTimeField(auto_now_add=True)
    
    shipped = models.BooleanField(default=False)
    
    date_shipped = models.DateTimeField(blank=True, null=True)
    
    tracking_number = models.CharField(max_length=300, blank=True, null=True)
    
    courier = models.CharField(max_length=300, blank=True, null=True)
    
    id = models.BigAutoField(primary_key=True)
    
    #FK
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        
        return 'Order - #' + str(self.id)
    
# auto add shipping date
@receiver(pre_save, sender=Order)
def set_shipped_date_on_update(sender, instance, **kwargs):
    if instance.pk:
        now = timezone.now()
        obj = sender._default_manager.get(pk=instance.pk)
        if instance.shipped and not obj.shipped:
            instance.date_shipped = now
    

class OrderItem(models.Model):
    
    # FK - >
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True)
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True)
    
    quantity = models.PositiveBigIntegerField(default=1)
    
    price = models.DecimalField(max_digits=8, decimal_places=2)

    #FK
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
    
        return 'Order Item - #' + str(self.id)
    
    
    
    
    
    