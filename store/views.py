from django.shortcuts import render, get_object_or_404

from . models import Category, Product

from django.core.paginator import Paginator


# Create your views here.

def store(request):
    
    all_products = Product.objects.all()
    
    p = Paginator(Product.objects.all().order_by('pk'), 25)
    page = request.GET.get('page')
    products = p.get_page(page)
    
    context = { 'all_products': all_products, 'products': products }
    
    return render(request, 'store/store.html', context)


def categories(request):
    
    all_categories = Category.objects.all()
    
    return {'all_categories': all_categories}


def list_category(request, category_slug=None):
    
    category = get_object_or_404(Category, slug=category_slug)
    
    products = Product.objects.filter(category=category)
    
    return render(request , 'store/list-category.html', { 'category': category, 'products': products })


def product_info(request, product_slug):
    
    product = get_object_or_404(Product, slug=product_slug)
    
    context =  { 'product': product }
    
    return render(request, 'store/product-info.html', context)