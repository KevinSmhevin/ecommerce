from django.db import models

from django.urls import reverse

# Create your models here.

class Category(models.Model):
    
    name = models.CharField(max_length=250, db_index=True)
    
    slug = models.SlugField(max_length=250, unique=True) #item category
    
    class Meta:
        
        verbose_name_plural = 'categories'
        
    
    
    def __str__(self):
        
        #return name instead of record id in db 
        
        return self.name
    
    def get_absolute_url(self):
        
        return reverse('list-category', args=[self.slug])
    

class Product(models.Model):
    
    category = models.ForeignKey(Category, related_name='product', on_delete=models.CASCADE, null=True)
    
    title = models.CharField(max_length=250)
    
    brand = models.CharField(max_length=250, default='un-branded')
    
    description = models.TextField(blank=True)
    
    slug = models.SlugField(max_length=255)
    
    price = models.DecimalField(max_digits=7, decimal_places=2)
    
    image = models.ImageField(upload_to='images/')
    
    image2 = models.ImageField(upload_to='images/', blank=True, null=True)
    
    image3 = models.ImageField(upload_to='images/', blank=True, null=True)

    image4 = models.ImageField(upload_to='images/', blank=True, null=True)

    stock = models.PositiveIntegerField(default=0)
    
    units_sold = models.PositiveIntegerField(default=0)
    
    class Meta:
    
        verbose_name_plural = 'products'
        
    def __str__(self):
                
        return self.title
    
    
    def get_absolute_url(self):
        
        return reverse('product-info', args=[self.slug])
    