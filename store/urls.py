from django.urls import path

from . import views

urlpatterns = [
    
    # Storage main page
    
    path('', views.store, name='store'),
    
    # Individual product
    
    path('product/<slug:product_slug>/', views.product_info, name='product-info'),
    
    # Add product
    path('product/<slug:product_slug>/add/', views.product_info, name='product-info-add'),
    
    # Individual Category
    
    path('search/<slug:category_slug>/', views.list_category, name='list-category'),

    
]