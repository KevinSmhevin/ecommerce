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

    @override_settings(
        EBAY_STORE_CATEGORY_IDS=['/Pokemon/Plushies'],
        EBAY_FALLBACK_CATEGORY_SLUG='cards',
    )
    def test_allowlist_uses_configured_fallback_category(self):
        client = _FakeClient(
            items=[_inventory_item(sku='SKU-Plush')],
            offers_by_sku={'SKU-Plush': [_offer(sku='SKU-Plush', store_category='/Pokemon/Plushies')]},
        )
        with _patch_image_download():
            report = SyncService(client=client).sync_all()

        self.assertEqual((report.created, report.skipped), (1, 0))
        product = Product.objects.get(ebay_listing_id='SKU-Plush')
        self.assertEqual(product.category, self.cards_category)

    @override_settings(
        EBAY_STORE_CATEGORY_IDS=['/Pokemon/Plushies'],
        EBAY_FALLBACK_CATEGORY_SLUG='',
    )
    def test_allowlist_without_configured_fallback_errors(self):
        client = _FakeClient(
            items=[_inventory_item(sku='SKU-Plush')],
            offers_by_sku={'SKU-Plush': [_offer(sku='SKU-Plush', store_category='/Pokemon/Plushies')]},
        )
        with _patch_image_download():
            report = SyncService(client=client).sync_all()

        self.assertEqual(report.errors, 1)
        self.assertFalse(Product.objects.filter(ebay_listing_id='SKU-Plush').exists())

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

    def test_uses_first_successful_image_when_an_earlier_one_fails(self):
        client = _FakeClient(
            items=[_inventory_item(image_count=2)],
            offers_by_sku={'SKU-1': [_offer()]},
        )
        ok = mock.Mock(status_code=200, content=_png_bytes())
        bad = mock.Mock(status_code=404, content=b'')
        with mock.patch('ebay.services.sync.requests.get', side_effect=[bad, ok]):
            report = SyncService(client=client).sync_all()

        self.assertEqual((report.created, report.errors), (1, 0))
        self.assertTrue(Product.objects.get(ebay_listing_id='SKU-1').image)

    def test_missing_quantity_does_not_zero_existing_stock(self):
        client = _FakeClient(items=[_inventory_item(stock=4)], offers_by_sku={'SKU-1': [_offer()]})
        with _patch_image_download():
            SyncService(client=client).sync_all()

        item = _inventory_item(stock=4)
        del item['availability']
        client2 = _FakeClient(items=[item], offers_by_sku={'SKU-1': [_offer()]})
        with _patch_image_download():
            report = SyncService(client=client2).sync_all()

        self.assertEqual(report.updated, 1)
        self.assertEqual(Product.objects.get(ebay_listing_id='SKU-1').stock, 4)

    def test_missing_quantity_defaults_new_product_to_zero(self):
        item = _inventory_item()
        del item['availability']
        client = _FakeClient(items=[item], offers_by_sku={'SKU-1': [_offer()]})
        with _patch_image_download():
            SyncService(client=client).sync_all()

        self.assertEqual(Product.objects.get(ebay_listing_id='SKU-1').stock, 0)

    def test_distinct_skus_with_colliding_base_slug_get_unique_slugs(self):
        items = [
            _inventory_item(sku='AAAAAAAA', title='Dup'),
            _inventory_item(sku='XAAAAAAAA', title='Dup'),
        ]
        offers = {
            'AAAAAAAA': [_offer(sku='AAAAAAAA')],
            'XAAAAAAAA': [_offer(sku='XAAAAAAAA')],
        }
        with _patch_image_download():
            report = SyncService(client=_FakeClient(items=items, offers_by_sku=offers)).sync_all()

        self.assertEqual(report.created, 2)
        slugs = set(Product.objects.values_list('slug', flat=True))
        self.assertEqual(len(slugs), 2)

    def _ebay_product(self, ebay_listing_id, stock):
        return Product.objects.create(
            category=self.cards_category,
            title=f'Old {ebay_listing_id}',
            slug=f'old-{ebay_listing_id.lower()}',
            price=Decimal('1.00'),
            image='images/old.jpg',
            stock=stock,
            ebay_listing_id=ebay_listing_id,
        )

    def test_deactivates_product_no_longer_in_feed(self):
        self._ebay_product('GONE', stock=5)
        client = _FakeClient(items=[_inventory_item()], offers_by_sku={'SKU-1': [_offer()]})
        with _patch_image_download():
            report = SyncService(client=client).sync_all()

        self.assertEqual(report.deactivated, 1)
        self.assertEqual(Product.objects.get(ebay_listing_id='GONE').stock, 0)
        self.assertEqual(Product.objects.get(ebay_listing_id='SKU-1').stock, 4)

    def test_deactivates_product_when_offer_becomes_unpublished(self):
        client = _FakeClient(items=[_inventory_item(stock=4)], offers_by_sku={'SKU-1': [_offer()]})
        with _patch_image_download():
            SyncService(client=client).sync_all()

        client2 = _FakeClient(
            items=[_inventory_item(stock=4)],
            offers_by_sku={'SKU-1': [_offer(status='UNPUBLISHED')]},
        )
        report = SyncService(client=client2).sync_all()

        self.assertEqual(report.deactivated, 1)
        self.assertEqual(Product.objects.get(ebay_listing_id='SKU-1').stock, 0)

    def test_errored_item_is_not_deactivated(self):
        self._ebay_product('SKU-1', stock=3)
        bad_offer = _offer()
        del bad_offer['pricingSummary']
        client = _FakeClient(items=[_inventory_item()], offers_by_sku={'SKU-1': [bad_offer]})
        report = SyncService(client=client).sync_all()

        self.assertEqual(report.errors, 1)
        self.assertEqual(report.deactivated, 0)
        self.assertEqual(Product.objects.get(ebay_listing_id='SKU-1').stock, 3)

    def test_dry_run_does_not_deactivate(self):
        self._ebay_product('GONE', stock=5)
        client = _FakeClient(items=[_inventory_item()], offers_by_sku={'SKU-1': [_offer()]})
        report = SyncService(client=client, dry_run=True).sync_all()

        self.assertEqual(report.deactivated, 0)
        self.assertEqual(Product.objects.get(ebay_listing_id='GONE').stock, 5)
