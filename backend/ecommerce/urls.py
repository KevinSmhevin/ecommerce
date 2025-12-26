"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

from store.api_views import CategoryViewSet, ProductViewSet

# API Router
router = DefaultRouter()
router.register(r'api/categories', CategoryViewSet, basename='category')
router.register(r'api/products', ProductViewSet, basename='product')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Routes
    path('', include(router.urls)),
    
    # Store app (legacy templates)
    path('', include('store.urls')),
    
    # Cart app
    path('cart/', include('cart.urls')),
    
    # Account app
    path('account/', include('account.urls')),
    
    # Payment app
    path('payment/', include('payment.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)