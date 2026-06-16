"""eBay → Pokebin one-way sync.

Pulls inventory items from the seller's eBay account, filters by the
`EbayCategoryMapping` table, and upserts a `store.Product` per matched
SKU. The SKU is the stable idempotency key — it lives on both
`EbayListing.ebay_item_id` and `Product.ebay_listing_id`.

This module knows nothing about HTTP — `EbayClient` does. That keeps the
sync logic unit-testable with a mock client.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from io import BytesIO
from typing import Optional
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from ebay.models import EbayCategoryMapping, EbayListing
from store.models import Product

from .client import EbayApiError, EbayClient

logger = logging.getLogger(__name__)


@dataclass
class SyncReport:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0
    error_details: list[str] = field(default_factory=list)

    @property
    def processed(self) -> int:
        return self.created + self.updated + self.skipped + self.errors

    def as_text(self) -> str:
        lines = [
            f'Processed: {self.processed}',
            f'  created: {self.created}',
            f'  updated: {self.updated}',
            f'  skipped: {self.skipped}',
            f'  errors:  {self.errors}',
        ]
        if self.error_details:
            lines.append('Errors:')
            lines.extend(f'  - {detail}' for detail in self.error_details[:20])
            if len(self.error_details) > 20:
                lines.append(f'  … ({len(self.error_details) - 20} more)')
        return '\n'.join(lines)


class SyncService:
    """Orchestrates a single sweep of the seller's eBay inventory.

    Caller is expected to handle scheduling (cron, admin button, etc.).
    """

    def __init__(self, client: Optional[EbayClient] = None, *, dry_run: bool = False):
        self.client = client or EbayClient()
        self.dry_run = dry_run

    def sync_all(self) -> SyncReport:
        report = SyncReport()
        mapping_lookup = self._load_category_mappings()
        allowlist = set(getattr(settings, 'EBAY_STORE_CATEGORY_IDS', []) or [])

        for item in self.client.iter_inventory_items():
            sku = item.get('sku')
            if not sku:
                report.skipped += 1
                continue

            try:
                self._sync_one(item, mapping_lookup, allowlist, report)
            except Exception as exc:  # noqa: BLE001 — per-item isolation
                logger.exception('sync_ebay failed for sku=%s', sku)
                report.errors += 1
                report.error_details.append(f'{sku}: {exc}')
                self._record_error(sku, exc)

        return report

    # -- Per-item ---------------------------------------------------------

    def _sync_one(
        self,
        item: dict,
        mapping_lookup: dict[str, EbayCategoryMapping],
        allowlist: set[str],
        report: SyncReport,
    ) -> None:
        sku = item['sku']
        offers = self.client.get_offers_for_sku(sku)
        offer = self._pick_published_offer(offers)
        if offer is None:
            report.skipped += 1
            self._record_skip(sku, 'no published offer')
            return

        store_category_keys = offer.get('storeCategoryNames') or []
        mapping = self._match_mapping(store_category_keys, mapping_lookup)
        if mapping is None and not (allowlist and any(k in allowlist for k in store_category_keys)):
            report.skipped += 1
            self._record_skip(
                sku,
                f'unmapped store category ({store_category_keys or "none"})',
            )
            return

        if self.dry_run:
            # Still account for it so the report is meaningful.
            existing = Product.objects.filter(ebay_listing_id=sku).exists()
            if existing:
                report.updated += 1
            else:
                report.created += 1
            return

        with transaction.atomic():
            product, created = self._upsert_product(item, offer, mapping)
            self._upsert_listing(sku, product, offer, store_category_keys)
        if created:
            report.created += 1
        else:
            report.updated += 1

    # -- Product upsert ---------------------------------------------------

    def _upsert_product(
        self,
        item: dict,
        offer: dict,
        mapping: Optional[EbayCategoryMapping],
    ) -> tuple[Product, bool]:
        sku = item['sku']
        product_payload = item.get('product') or {}
        title = product_payload.get('title') or f'eBay {sku}'
        brand = product_payload.get('brand') or 'un-branded'
        description = (
            offer.get('listingDescription')
            or product_payload.get('description')
            or ''
        )
        price = self._extract_price(offer)
        stock = self._extract_quantity(item)

        existing = Product.objects.filter(ebay_listing_id=sku).first()
        if existing:
            existing.title = title
            existing.brand = brand
            existing.description = description
            existing.price = price
            existing.stock = stock
            if mapping is not None:
                existing.category = mapping.pokebin_category
            existing.save()
            return existing, False

        if mapping is None:
            # Allowlisted-but-unmapped items still need a category to satisfy
            # the FK; use the first existing category as a last resort. The
            # admin can re-categorise after the fact.
            from store.models import Category
            fallback = Category.objects.first()
            if fallback is None:
                raise EbayApiError(
                    f'sku={sku} has no category mapping and no fallback Category exists.'
                )
            category = fallback
        else:
            category = mapping.pokebin_category

        image_urls = product_payload.get('imageUrls') or []
        image_files = [
            self._download_image(url, sku, idx)
            for idx, url in enumerate(image_urls[:4])
        ]
        # Pad to 4 slots so we can splat into the kwargs.
        while len(image_files) < 4:
            image_files.append(None)
        if image_files[0] is None:
            raise EbayApiError(
                f'sku={sku} has no usable image URL; eBay returned {image_urls!r}.'
            )

        product = Product.objects.create(
            category=category,
            title=title,
            brand=brand,
            description=description,
            slug=self._make_slug(title, sku),
            price=price,
            image=image_files[0],
            image2=image_files[1],
            image3=image_files[2],
            image4=image_files[3],
            stock=stock,
            ebay_listing_id=sku,
        )
        return product, True

    # -- EbayListing audit -----------------------------------------------

    def _upsert_listing(
        self,
        sku: str,
        product: Product,
        offer: dict,
        store_category_keys: list[str],
    ) -> EbayListing:
        primary_category = store_category_keys[0] if store_category_keys else ''
        listing, _ = EbayListing.objects.update_or_create(
            ebay_item_id=sku,
            defaults={
                'product': product,
                'ebay_store_category_id': primary_category,
                'ebay_last_modified': self._parse_dt(offer.get('listingDuration')),
                'last_synced_at': timezone.now(),
                'sync_state': 'synced',
                'sync_error': '',
            },
        )
        return listing

    def _record_skip(self, sku: str, reason: str) -> None:
        if self.dry_run:
            return
        EbayListing.objects.update_or_create(
            ebay_item_id=sku,
            defaults={
                'last_synced_at': timezone.now(),
                'sync_state': 'skipped',
                'sync_error': reason,
            },
        )

    def _record_error(self, sku: str, exc: Exception) -> None:
        if self.dry_run:
            return
        EbayListing.objects.update_or_create(
            ebay_item_id=sku,
            defaults={
                'last_synced_at': timezone.now(),
                'sync_state': 'error',
                'sync_error': str(exc)[:1000],
            },
        )

    # -- Helpers ----------------------------------------------------------

    def _load_category_mappings(self) -> dict[str, EbayCategoryMapping]:
        return {
            m.ebay_store_category_id: m
            for m in EbayCategoryMapping.objects.filter(active=True).select_related(
                'pokebin_category'
            )
        }

    @staticmethod
    def _match_mapping(
        store_category_keys: list[str],
        lookup: dict[str, EbayCategoryMapping],
    ) -> Optional[EbayCategoryMapping]:
        for key in store_category_keys:
            if key in lookup:
                return lookup[key]
        return None

    @staticmethod
    def _pick_published_offer(offers: list[dict]) -> Optional[dict]:
        published = [o for o in offers if (o.get('status') or '').upper() == 'PUBLISHED']
        return (published or offers or [None])[0]

    @staticmethod
    def _extract_price(offer: dict):
        from decimal import Decimal
        try:
            return Decimal(offer['pricingSummary']['price']['value'])
        except (KeyError, TypeError, ValueError) as exc:
            raise EbayApiError(f'offer missing pricingSummary.price.value: {exc}') from exc

    @staticmethod
    def _extract_quantity(item: dict) -> int:
        try:
            return int(item['availability']['shipToLocationAvailability']['quantity'])
        except (KeyError, TypeError, ValueError):
            return 0

    @staticmethod
    def _parse_dt(value):
        # eBay returns ISO 8601 timestamps; we lean on dateutil if present,
        # otherwise return None and let the field stay null.
        if not value:
            return None
        try:
            from dateutil.parser import isoparse
            return isoparse(value)
        except Exception:
            return None

    @staticmethod
    def _make_slug(title: str, sku: str) -> str:
        base = slugify(title) or 'ebay-item'
        # SKU disambiguates collisions without an extra DB roundtrip.
        suffix = slugify(sku)[-8:] if sku else ''
        candidate = f'{base}-{suffix}' if suffix else base
        return candidate[:255]

    @staticmethod
    def _download_image(url: str, sku: str, index: int) -> Optional[ContentFile]:
        if not url:
            return None
        try:
            resp = requests.get(url, timeout=20)
        except requests.RequestException as exc:
            logger.warning('image download failed for %s: %s', url, exc)
            return None
        if resp.status_code != 200:
            logger.warning('image %s returned %s', url, resp.status_code)
            return None

        # Pick a sensible filename: keep eBay's extension when possible.
        path = urlparse(url).path
        ext = os.path.splitext(path)[1] or '.jpg'
        name = f'ebay-{slugify(sku)}-{index}{ext}'
        return ContentFile(resp.content, name=name)
