from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        category = self.get_object()
        products = Product.objects.filter(category=category, stock__gt=0)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(stock__gt=0)
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'brand']
    ordering_fields = ['price', 'title']
    ordering = ['pk']
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Product.objects.filter(stock__gt=0)
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_slug = request.query_params.get('category', None)
        if category_slug:
            try:
                category = Category.objects.get(slug=category_slug)
                products = self.queryset.filter(category=category)
                serializer = self.get_serializer(products, many=True)
                return Response(serializer.data)
            except Category.DoesNotExist:
                return Response({'error': 'Category not found'}, status=404)
        return Response({'error': 'Category slug required'}, status=400)

