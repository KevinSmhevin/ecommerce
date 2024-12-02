from django.db import models

# Create your models here.

class Category(models.Model):
    
    name = models.CharField(max_length=250, db_index=True)
    
    slug = models.SlugField(max_length=250, unique=True) #item category
    
    class Meta:
        
        verbose_name_plural = 'categories'
        
    
    
    def __str__(self):
        
        #return name instead of record id in db 
        
        return self.name
    

class Product(models.Model):
    
    title = models.CharField(max_length=250)
    
    brand = models.CharField(max_length=250, default='un-branded')
    
    description = models.TextField(blank=True)
    
    slug = models.SlugField(max_length=255)
    
    price = models.DecimalField(max_digits=7, decimal_places=2)
    
    image = models.ImageField(upload_to='images/')
    
    class Meta:
    
        verbose_name_plural = 'products'
        
    def __str__(self):
                
        return self.title
    