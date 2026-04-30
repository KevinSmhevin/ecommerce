from django.db import models


class EbayAuthToken(models.Model):
    """Singleton row holding the seller's OAuth tokens.

    The refresh token is the long-lived credential (eBay refreshes typically
    last ~18 months); the access token is a short-lived cache so callers can
    skip a refresh round-trip on every request.
    """

    refresh_token = models.TextField()
    refresh_token_expires_at = models.DateTimeField(null=True, blank=True)
    access_token = models.TextField(blank=True)
    access_token_expires_at = models.DateTimeField(null=True, blank=True)
    scope = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'eBay auth token'
        verbose_name_plural = 'eBay auth token'

    def __str__(self):
        return f'EbayAuthToken(updated_at={self.updated_at:%Y-%m-%d %H:%M})'


class EbayCategoryMapping(models.Model):
    """Maps an eBay store category to a Pokebin Category.

    The sync worker only mirrors listings whose store category appears here
    with `active=True`.
    """

    ebay_store_category_id = models.CharField(max_length=64, unique=True)
    ebay_store_category_name = models.CharField(max_length=255, blank=True)
    pokebin_category = models.ForeignKey(
        'store.Category',
        on_delete=models.PROTECT,
        related_name='ebay_mappings',
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'eBay category mapping'
        verbose_name_plural = 'eBay category mappings'
        ordering = ['ebay_store_category_name', 'ebay_store_category_id']

    def __str__(self):
        label = self.ebay_store_category_name or self.ebay_store_category_id
        return f'{label} → {self.pokebin_category}'


class EbayListing(models.Model):
    """One row per eBay listing the worker has seen.

    Provides idempotency (upsert by `ebay_item_id`) and an audit trail of the
    last sync attempt.
    """

    SYNC_STATES = [
        ('pending', 'Pending'),
        ('synced', 'Synced'),
        ('skipped', 'Skipped'),
        ('error', 'Error'),
    ]

    ebay_item_id = models.CharField(max_length=64, unique=True, db_index=True)
    product = models.OneToOneField(
        'store.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ebay_listing',
    )
    ebay_store_category_id = models.CharField(max_length=64, blank=True, db_index=True)
    ebay_last_modified = models.DateTimeField(null=True, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_state = models.CharField(max_length=32, choices=SYNC_STATES, default='pending')
    sync_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'eBay listing'
        verbose_name_plural = 'eBay listings'
        ordering = ['-updated_at']

    def __str__(self):
        return f'eBay {self.ebay_item_id} ({self.sync_state})'
