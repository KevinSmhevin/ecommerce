"""Tests for SyncService.

Mocks `EbayClient.iter_inventory_items` / `get_offers_for_sku` and the
network call inside `_download_image` so the suite runs offline. Uses
the default FileSystemStorage; we don't need to validate where the bytes
land — only that the upsert logic is correct.
"""

from decimal import Decimal
from io import BytesIO
from unittest import mock

from django.test import TestCase, override_settings
from PIL import Image

from ebay.models import EbayCategoryMapping, EbayListing
from ebay.services import SyncService
from store.models import Category, Product


def _png_bytes() -> bytes:
    buf = BytesIO()
    Image.new('RGB', (8, 8), color=(255, 0, 0)).save(buf, format='PNG')
    return buf.getvalue()


def _inventory_item(sku='SKU-1', title='Charizard EX', stock=4, image_count=1):
    return {
        'sku': sku,
        'product': {
            'title': title,
            'description': 'A Pokémon card.',
            'brand': 'Pokebin',
            'imageUrls': [f'https://i.ebayimg.com/{sku}/{i}.jpg' for i in range(image_count)],
        },
        'availability': {
            'shipToLocationAvailability': {'quantity': stock},
        },
        'condition': 'NEW',
    }


def _offer(sku='SKU-1', price='149.99', store_category='/Pokemon/Cards', status='PUBLISHED'):
    return {
        'offerId': f'OFFER-{sku}',
        'sku': sku,
        'marketplaceId': 'EBAY_US',
        'format': 'FIXED_PRICE',
        'status': status,
        'pricingSummary': {'price': {'value': price, 'currency': 'USD'}},
        'storeCategoryNames': [store_category],
        'listingDescription': '<p>Mint condition.</p>',
    }


class _FakeClient:
    """Minimal stand-in for EbayClient — only the methods SyncService calls."""

    def __init__(self, items=(), offers_by_sku=None):
        self._items = list(items)
        self._offers = offers_by_sku or {}

    def iter_inventory_items(self, page_size=100):
        yield from self._items

    def get_offers_for_sku(self, sku):
        return self._offers.get(sku, [])


def _patch_image_download(target='ebay.services.sync.requests.get'):
    response = mock.Mock()
    response.status_code = 200
    response.content = _png_bytes()
    return mock.patch(target, return_value=response)


class SyncServiceTests(TestCase):
    def setUp(self):
        self.cards_category = Category.objects.create(name='Cards', slug='cards')
        self.mapping = EbayCategoryMapping.objects.create(
            ebay_store_category_id='/Pokemon/Cards',
            ebay_store_category_name='Pokemon → Cards',
            pokebin_category=self.cards_category,
            active=True,
        )

    def test_creates_new_product_for_mapped_category(self):
        client = _FakeClient(
            items=[_inventory_item()],
            offers_by_sku={'SKU-1': [_offer()]},
        )
        with _patch_image_download():
            report = SyncService(client=client).sync_all()

        self.assertEqual((report.created, report.updated, report.skipped, report.errors),
                         (1, 0, 0, 0))
        product = Product.objects.get(ebay_listing_id='SKU-1')
        self.assertEqual(product.title, 'Charizard EX')
        self.assertEqual(product.price, Decimal('149.99'))
        self.assertEqual(product.stock, 4)
        self.assertEqual(product.category, self.cards_category)
        listing = EbayListing.objects.get(ebay_item_id='SKU-1')
        self.assertEqual(listing.sync_state, 'synced')
        self.assertEqual(listing.product, product)

    def test_updates_existing_product_idempotently(self):
        client = _FakeClient(
            items=[_inventory_item(stock=4)],
            offers_by_sku={'SKU-1': [_offer(price='149.99')]},
        )
        with _patch_image_download():
            SyncService(client=client).sync_all()

        # Second run with changed stock + price.
        client2 = _FakeClient(
            items=[_inventory_item(stock=2)],
            offers_by_sku={'SKU-1': [_offer(price='159.99')]},
        )
        with _patch_image_download():
            report = SyncService(client=client2).sync_all()

        self.assertEqual((report.created, report.updated), (0, 1))
        product = Product.objects.get(ebay_listing_id='SKU-1')
        self.assertEqual(product.stock, 2)
        self.assertEqual(product.price, Decimal('159.99'))
        self.assertEqual(Product.objects.count(), 1)

    def test_skips_unmapped_store_category(self):
        client = _FakeClient(
            items=[_inventory_item(sku='SKU-Plush')],
            offers_by_sku={'SKU-Plush': [_offer(sku='SKU-Plush', store_category='/Pokemon/Plushies')]},
        )
        with _patch_image_download():
            report = SyncService(client=client).sync_all()

        self.assertEqual((report.created, report.skipped), (0, 1))
        self.assertFalse(Product.objects.filter(ebay_listing_id='SKU-Plush').exists())
        listing = EbayListing.objects.get(ebay_item_id='SKU-Plush')
        self.assertEqual(listing.sync_state, 'skipped')

    @override_settings(EBAY_STORE_CATEGORY_IDS=['/Pokemon/Plushies'])
    def test_allowlist_acts_as_mapping_fallback(self):
        client = _FakeClient(
            items=[_inventory_item(sku='SKU-Plush')],
            offers_by_sku={'SKU-Plush': [_offer(sku='SKU-Plush', store_category='/Pokemon/Plushies')]},
        )
        with _patch_image_download():
            report = SyncService(client=client).sync_all()

        # Allowlist hit → product created using the fallback Category.
        self.assertEqual((report.created, report.skipped), (1, 0))
        self.assertTrue(Product.objects.filter(ebay_listing_id='SKU-Plush').exists())

    def test_skips_when_no_offer_published(self):
        client = _FakeClient(
            items=[_inventory_item()],
            offers_by_sku={'SKU-1': []},
        )
        report = SyncService(client=client).sync_all()
        self.assertEqual((report.created, report.skipped), (0, 1))
        self.assertEqual(EbayListing.objects.get(ebay_item_id='SKU-1').sync_state, 'skipped')

    def test_skips_when_only_unpublished_offer_exists(self):
        client = _FakeClient(
            items=[_inventory_item()],
            offers_by_sku={'SKU-1': [_offer(status='UNPUBLISHED')]},
        )
        report = SyncService(client=client).sync_all()
        self.assertEqual((report.created, report.skipped), (0, 1))
        self.assertFalse(Product.objects.filter(ebay_listing_id='SKU-1').exists())
        self.assertEqual(EbayListing.objects.get(ebay_item_id='SKU-1').sync_state, 'skipped')

    def test_image_download_failure_records_error(self):
        client = _FakeClient(
            items=[_inventory_item()],
            offers_by_sku={'SKU-1': [_offer()]},
        )
        bad_response = mock.Mock(status_code=404, content=b'')
        with mock.patch('ebay.services.sync.requests.get', return_value=bad_response):
            report = SyncService(client=client).sync_all()

        self.assertEqual(report.errors, 1)
        self.assertFalse(Product.objects.filter(ebay_listing_id='SKU-1').exists())
        self.assertEqual(EbayListing.objects.get(ebay_item_id='SKU-1').sync_state, 'error')

    def test_dry_run_does_not_write(self):
        client = _FakeClient(
            items=[_inventory_item()],
            offers_by_sku={'SKU-1': [_offer()]},
        )
        # No image download patch — dry_run shouldn't reach that code path.
        report = SyncService(client=client, dry_run=True).sync_all()
        self.assertEqual((report.created, report.updated), (1, 0))
        self.assertFalse(Product.objects.exists())
        self.assertFalse(EbayListing.objects.exists())
