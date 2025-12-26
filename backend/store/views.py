from django.shortcuts import render, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator

from . models import Category, Product



# Create your views here.

def store(request):
    
    all_products = Product.objects.filter(stock__gt=0).values()
    
    # Get sort parameter from request
    sort_by = request.GET.get('sort', 'default')
    
    # Apply sorting based on parameter
    if sort_by == 'price_asc':
        queryset = Product.objects.all().filter(stock__gt=0).order_by('price')
    elif sort_by == 'price_desc':
        queryset = Product.objects.all().filter(stock__gt=0).order_by('-price')
    else:
        queryset = Product.objects.all().filter(stock__gt=0).order_by('pk')
    
    p = Paginator(queryset, 6)
    page = request.GET.get('page')
    products = p.get_page(page)
    
    context = { 'all_products': all_products, 'products': products, 'current_sort': sort_by }
    
    return render(request, 'store/store.html', context)


def categories(request):
    
    all_categories = Category.objects.all()
    
    return {'all_categories': all_categories}


def list_category(request, category_slug=None):
    
    category = get_object_or_404(Category, slug=category_slug)
    
    # Get sort parameter from request
    sort_by = request.GET.get('sort', 'default')
    
    # Apply sorting based on parameter
    if sort_by == 'price_asc':
        products = Product.objects.filter(category=category, stock__gt=0).order_by('price')
    elif sort_by == 'price_desc':
        products = Product.objects.filter(category=category, stock__gt=0).order_by('-price')
    else:
        products = Product.objects.filter(category=category, stock__gt=0)
    
    return render(request , 'store/list-category.html', { 'category': category, 'products': products, 'current_sort': sort_by })


def product_info(request, product_slug):
    
    product = get_object_or_404(Product, slug=product_slug)
    
    context =  { 'product': product }
    
    if request.method == 'POST':
        messages.success(request, 'Quantity updated successfully!')
        return render(request, 'store/product-info.html', context)
    
    return render(request, 'store/product-info.html', context)

def add(request, product_slug):
    
    product = get_object_or_404(Product, slug=product_slug)
    
    
    