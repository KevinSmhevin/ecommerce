from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    image_url = serializers.SerializerMethodField()
    image2_url = serializers.SerializerMethodField()
    image3_url = serializers.SerializerMethodField()
    image4_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'brand', 'description', 'slug', 'price',
            'category', 'category_id', 'stock', 'units_sold',
            'image_url', 'image2_url', 'image3_url', 'image4_url'
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Fallback: use S3 URL if available, otherwise return relative path
            # In production with S3, image.url will already be a full URL
            if obj.image.url.startswith('http'):
                return obj.image.url
            # For local development fallback only
            from django.conf import settings
            if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME') and settings.AWS_STORAGE_BUCKET_NAME:
                # S3 is configured, return the S3 URL
                return obj.image.url if obj.image.url.startswith('http') else f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com{obj.image.url}"
            return obj.image.url
        return None

    def get_image2_url(self, obj):
        if obj.image2:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image2.url)
            if obj.image2.url.startswith('http'):
                return obj.image2.url
            from django.conf import settings
            if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME') and settings.AWS_STORAGE_BUCKET_NAME:
                return obj.image2.url if obj.image2.url.startswith('http') else f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com{obj.image2.url}"
            return obj.image2.url
        return None

    def get_image3_url(self, obj):
        if obj.image3:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image3.url)
            if obj.image3.url.startswith('http'):
                return obj.image3.url
            from django.conf import settings
            if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME') and settings.AWS_STORAGE_BUCKET_NAME:
                return obj.image3.url if obj.image3.url.startswith('http') else f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com{obj.image3.url}"
            return obj.image3.url
        return None

    def get_image4_url(self, obj):
        if obj.image4:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image4.url)
            if obj.image4.url.startswith('http'):
                return obj.image4.url
            from django.conf import settings
            if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME') and settings.AWS_STORAGE_BUCKET_NAME:
                return obj.image4.url if obj.image4.url.startswith('http') else f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com{obj.image4.url}"
            return obj.image4.url
        return None

