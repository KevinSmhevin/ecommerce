"""Migrate traditional eBay listings into the Inventory/Offer model.

`getInventoryItems` — what `sync_ebay` reads — only returns listings created
through the Inventory API. Listings created on the eBay site (or via the
Trading API) are invisible to it until migrated. eBay's bulk_migrate_listing
converts eligible active listings into inventory-item + offer records, after
which the sync can see them. Each listing must already carry a SKU.

This is a one-time write, so it needs the read-write `sell.inventory` scope:
re-run `ebay_oauth` first if the stored token predates that scope.

    python manage.py ebay_migrate 110123456789 110987654321
    python manage.py ebay_migrate --file listing_ids.txt
"""

from django.core.management.base import BaseCommand, CommandError

from ebay.services import EbayApiError, EbayAuthError, EbayClient

BATCH_SIZE = 5  # eBay's hard cap per bulk_migrate_listing call.


def chunked(items: list[str], size: int):
    for start in range(0, len(items), size):
        yield items[start:start + size]


class Command(BaseCommand):
    help = 'Migrate traditional eBay listings into the Inventory API model so the sync can see them.'

    def add_arguments(self, parser):
        parser.add_argument(
            'listing_ids', nargs='*', help='eBay listing (item) IDs to migrate.'
        )
        parser.add_argument(
            '--file', help='Read listing IDs from a file, one per line.'
        )

    def handle(self, *args, **options):
        listing_ids = self._gather_listing_ids(options)
        if not listing_ids:
            raise CommandError('No listing IDs given. Pass them as arguments or via --file.')

        responses = self._migrate(listing_ids)
        self._report(responses)

    def _gather_listing_ids(self, options) -> list[str]:
        raw_ids = list(options['listing_ids'])
        if options.get('file'):
            raw_ids.extend(self._read_ids_file(options['file']))
        return self._dedupe_preserving_order(raw_ids)

    @staticmethod
    def _read_ids_file(path: str) -> list[str]:
        try:
            with open(path, encoding='utf-8') as handle:
                return [line.strip() for line in handle if line.strip()]
        except OSError as exc:
            raise CommandError(f'Could not read --file {path}: {exc}') from exc

    @staticmethod
    def _dedupe_preserving_order(raw_ids: list[str]) -> list[str]:
        seen: set[str] = set()
        unique: list[str] = []
        for raw in raw_ids:
            listing_id = raw.strip()
            if listing_id and listing_id not in seen:
                seen.add(listing_id)
                unique.append(listing_id)
        return unique

    def _migrate(self, listing_ids: list[str]) -> list[dict]:
        client = EbayClient()
        responses: list[dict] = []
        for batch in chunked(listing_ids, BATCH_SIZE):
            try:
                responses.extend(client.bulk_migrate_listing(batch))
            except EbayAuthError as exc:
                # Auth is global: every remaining batch would fail identically,
                # so stop rather than spam the same error per batch.
                raise CommandError(str(exc)) from exc
            except EbayApiError as exc:
                # A whole-batch transport error (eBay 400/500). Record each
                # listing as failed and keep going so migrations completed by
                # other batches are still reported instead of being discarded.
                responses.extend(self._batch_failures(batch, exc))
        return responses

    @staticmethod
    def _batch_failures(batch: list[str], exc: Exception) -> list[dict]:
        return [
            {'statusCode': 0, 'listingId': listing_id, 'errors': [{'message': str(exc)}]}
            for listing_id in batch
        ]

    def _report(self, responses: list[dict]) -> None:
        migrated = failed = 0
        for response in responses:
            if response.get('statusCode') == 200:
                migrated += 1
                self.stdout.write(self.style.SUCCESS(
                    f"✓ {response.get('listingId', '?')} → {self._inventory_summary(response)}"
                ))
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(
                    f"✗ {response.get('listingId', '?')}: {self._error_text(response)}"
                ))

        styler = self.style.SUCCESS if failed == 0 else self.style.WARNING
        self.stdout.write(styler(f'\nMigrated {migrated}, failed {failed}.'))

    @staticmethod
    def _inventory_summary(response: dict) -> str:
        """eBay nests the created SKU/offer under `inventoryItems[]`, not at the
        entry root (a multi-variation listing yields several)."""
        items = response.get('inventoryItems') or []
        skus = ','.join(item.get('sku', '') for item in items)
        offers = ','.join(item.get('offerId', '') for item in items if item.get('offerId'))
        return f'sku={skus} offer={offers}'

    @staticmethod
    def _error_text(response: dict) -> str:
        messages = [err.get('message', '') for err in response.get('errors') or []]
        return '; '.join(m for m in messages if m) or f"status {response.get('statusCode')}"
