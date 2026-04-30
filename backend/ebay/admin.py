from django.contrib import admin

from .models import EbayAuthToken, EbayCategoryMapping, EbayListing


@admin.register(EbayCategoryMapping)
class EbayCategoryMappingAdmin(admin.ModelAdmin):
    list_display = (
        'ebay_store_category_name',
        'ebay_store_category_id',
        'pokebin_category',
        'active',
        'updated_at',
    )
    list_filter = ('active',)
    search_fields = ('ebay_store_category_name', 'ebay_store_category_id')


@admin.register(EbayListing)
class EbayListingAdmin(admin.ModelAdmin):
    list_display = (
        'ebay_item_id',
        'product',
        'ebay_store_category_id',
        'sync_state',
        'last_synced_at',
        'updated_at',
    )
    list_filter = ('sync_state',)
    search_fields = ('ebay_item_id', 'product__title')
    readonly_fields = (
        'ebay_item_id',
        'product',
        'ebay_store_category_id',
        'ebay_last_modified',
        'last_synced_at',
        'sync_state',
        'sync_error',
        'created_at',
        'updated_at',
    )

    def has_add_permission(self, request):
        return False


@admin.register(EbayAuthToken)
class EbayAuthTokenAdmin(admin.ModelAdmin):
    list_display = (
        'pk',
        'access_token_expires_at',
        'refresh_token_expires_at',
        'updated_at',
    )
    readonly_fields = (
        'access_token',
        'access_token_expires_at',
        'refresh_token',
        'refresh_token_expires_at',
        'scope',
        'updated_at',
    )

    def has_add_permission(self, request):
        # Singleton: minted by `manage.py ebay_oauth`.
        return False
