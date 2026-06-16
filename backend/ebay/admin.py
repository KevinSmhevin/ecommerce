from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import path, reverse

from .models import EbayAuthToken, EbayCategoryMapping, EbayListing
from .services import EbayApiError, EbayAuthError, SyncService


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
    change_list_template = 'admin/ebay/ebaylisting/change_list.html'
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

    def get_urls(self):
        # Prepend our custom URL so it isn't shadowed by the default
        # `<path:object_id>/` route.
        return [
            path(
                'sync-now/',
                self.admin_site.admin_view(self.sync_now_view),
                name='ebay_ebaylisting_sync_now',
            ),
        ] + super().get_urls()

    def sync_now_view(self, request):
        if request.method != 'POST':
            return HttpResponseRedirect(
                reverse('admin:ebay_ebaylisting_changelist')
            )
        try:
            report = SyncService().sync_all()
        except EbayAuthError as exc:
            messages.error(request, f'eBay auth error: {exc}')
            return HttpResponseRedirect(
                reverse('admin:ebay_ebaylisting_changelist')
            )
        except EbayApiError as exc:
            messages.error(request, f'eBay API error: {exc}')
            return HttpResponseRedirect(
                reverse('admin:ebay_ebaylisting_changelist')
            )

        level = messages.SUCCESS if report.errors == 0 else messages.WARNING
        messages.add_message(
            request,
            level,
            f'eBay sync done — created={report.created}, updated={report.updated}, '
            f'skipped={report.skipped}, errors={report.errors}.',
        )
        for detail in report.error_details[:5]:
            messages.error(request, detail)
        return HttpResponseRedirect(reverse('admin:ebay_ebaylisting_changelist'))


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
