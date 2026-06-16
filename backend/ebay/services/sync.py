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
    deactivated: int = 0
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
            f'  deactivated: {self.deactivated}',
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
        unsellable_skus: set[str] = set()
        seen_skus: set[str] = set()

        for item in self.client.iter_inventory_items():
            sku = item.get('sku')
            if not sku:
                report.skipped += 1
                continue
            # eBay can re-yield a SKU across overlapping pages; process it once
            # so counts don't double and a sku can't be both synced and stale.
            if sku in seen_skus:
                continue
            seen_skus.add(sku)

            try:
                self._sync_one(item, mapping_lookup, allowlist, report, unsellable_skus)
            except Exception as exc:  # noqa: BLE001 — per-item isolation
                logger.exception('sync_ebay failed for sku=%s', sku)
                report.errors += 1
                report.error_details.append(f'{sku}: {exc}')
                self._record_error(sku, exc)

        if not self.dry_run:
            self._deactivate_unsellable(unsellable_skus, report)
        return report

    def _deactivate_unsellable(self, unsellable_skus: set[str], report: SyncReport) -> None:
        """Zero stock on products positively seen this sweep with no published
        offer (ended or unpublished on eBay), so they drop off the storefront.

        Scoped to SKUs we *observed* as unsellable — never to "everything not
        seen" — so an empty or partial feed, a paging gap, or a category-mapping
        change cannot mass-deactivate the catalog. SKUs absent from the feed
        entirely are left alone (an admin can zero those by hand).
        """
        if not unsellable_skus:
            return
        stale = Product.objects.filter(
            ebay_listing_id__in=list(unsellable_skus), stock__gt=0,
        )
        report.deactivated = stale.update(stock=0)

    # -- Per-item ---------------------------------------------------------

    def _sync_one(
        self,
        item: dict,
        mapping_lookup: dict[str, EbayCategoryMapping],
        allowlist: set[str],
        report: SyncReport,
        unsellable_skus: set[str],
    ) -> None:
        sku = item['sku']
        offers = self.client.get_offers_for_sku(sku)
        offer = self._pick_published_offer(offers)
        if offer is None:
            # In inventory but no live offer → ended/unpublished. Record it so
            # any product we previously created for it gets deactivated.
            unsellable_skus.add(sku)
            self._skip(report, sku, 'no published offer')
            return

        store_category_keys = offer.get('storeCategoryNames') or []
        mapping = self._match_mapping(store_category_keys, mapping_lookup)
        if mapping is None and not (allowlist and any(k in allowlist for k in store_category_keys)):
            self._skip(report, sku, f'unmapped store category ({store_category_keys or "none"})')
            return

        if self.dry_run:
            created = not Product.objects.filter(ebay_listing_id=sku).exists()
            self._tally_upsert(report, created)
            return

        with transaction.atomic():
            product, created = self._upsert_product(item, offer, mapping)
            self._upsert_listing(sku, product, offer, store_category_keys)
        self._tally_upsert(report, created)

    @staticmethod
    def _tally_upsert(report: SyncReport, created: bool) -> None:
        if created:
            report.created += 1
        else:
            report.updated += 1

    def _skip(self, report: SyncReport, sku: str, reason: str) -> None:
        report.skipped += 1
        self._record_skip(sku, reason)

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
        quantity = self._extract_quantity(item)

        existing = Product.objects.filter(ebay_listing_id=sku).first()
        if existing:
            existing.title = title
            existing.brand = brand
            existing.description = description
            existing.price = price
            # A missing quantity means "eBay didn't say", not "zero" — leave
            # the stored stock alone rather than hiding a live product.
            if quantity is not None:
                existing.stock = quantity
            if mapping is not None:
                existing.category = mapping.pokebin_category
            existing.save()
            return existing, False

        category = self._resolve_category(mapping, sku)
        images = self._collect_images(product_payload, sku)
        product = Product.objects.create(
            category=category,
            title=title,
            brand=brand,
            description=description,
            slug=self._make_slug(title, sku),
            price=price,
            image=images[0],
            image2=images[1],
            image3=images[2],
            image4=images[3],
            stock=quantity if quantity is not None else 0,
            ebay_listing_id=sku,
        )
        return product, True

    def _resolve_category(self, mapping: Optional[EbayCategoryMapping], sku: str):
        if mapping is not None:
            return mapping.pokebin_category
        from store.models import Category
        slug = getattr(settings, 'EBAY_FALLBACK_CATEGORY_SLUG', '') or ''
        if not slug:
            raise EbayApiError(
                f'sku={sku}: matched only via the allowlist but '
                'EBAY_FALLBACK_CATEGORY_SLUG is unset.'
            )
        fallback = Category.objects.filter(slug=slug).first()
        if fallback is None:
            raise EbayApiError(
                f'sku={sku}: EBAY_FALLBACK_CATEGORY_SLUG="{slug}" matches no Category.'
            )
        return fallback

    def _collect_images(self, product_payload: dict, sku: str) -> list:
        image_urls = product_payload.get('imageUrls') or []
        downloaded = [
            self._download_image(url, sku, idx)
            for idx, url in enumerate(image_urls[:4])
        ]
        usable = [image for image in downloaded if image is not None]
        if not usable:
            raise EbayApiError(
                f'sku={sku} has no usable image URL; eBay returned {image_urls!r}.'
            )
        return (usable + [None, None, None, None])[:4]

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
                'last_synced_at': timezone.now(),
                'sync_state': 'synced',
                'sync_error': '',
            },
        )
        return listing

    def _record_skip(self, sku: str, reason: str) -> None:
        self._record_outcome(sku, 'skipped', reason)

    def _record_error(self, sku: str, exc: Exception) -> None:
        self._record_outcome(sku, 'error', str(exc))

    def _record_outcome(self, sku: str, state: str, detail: str = '') -> None:
        if self.dry_run:
            return
        EbayListing.objects.update_or_create(
            ebay_item_id=sku,
            defaults={
                'last_synced_at': timezone.now(),
                'sync_state': state,
                'sync_error': detail[:1000],
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
        return published[0] if published else None

    @staticmethod
    def _extract_price(offer: dict):
        from decimal import Decimal
        try:
            return Decimal(offer['pricingSummary']['price']['value'])
        except (KeyError, TypeError, ValueError) as exc:
            raise EbayApiError(f'offer missing pricingSummary.price.value: {exc}') from exc

    @staticmethod
    def _extract_quantity(item: dict) -> Optional[int]:
        """Quantity from the item, or None when eBay omits it entirely."""
        try:
            return int(item['availability']['shipToLocationAvailability']['quantity'])
        except (KeyError, TypeError, ValueError):
            return None

    def _make_slug(self, title: str, sku: str) -> str:
        base = slugify(title) or 'ebay-item'
        suffix = slugify(sku)[-8:] if sku else ''
        candidate = (f'{base}-{suffix}' if suffix else base)[:255]
        return self._unique_slug(candidate)

    @staticmethod
    def _unique_slug(candidate: str) -> str:
        slug = candidate
        n = 2
        while Product.objects.filter(slug=slug).exists():
            slug = f'{candidate[:248]}-{n}'[:255]
            n += 1
        return slug

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
