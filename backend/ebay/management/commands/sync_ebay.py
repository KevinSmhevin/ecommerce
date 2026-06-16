"""Sync the seller's eBay inventory into the Pokebin catalog.

The CLI entry point for the sync — mainly for the large initial bulk import
(no web-request timeout). Day-to-day syncing runs from the admin "Sync now"
button. Same engine either way.

    python manage.py sync_ebay
    python manage.py sync_ebay --dry-run
"""

from django.core.management.base import BaseCommand, CommandError

from ebay.services import EbayAuthError, SyncService


class Command(BaseCommand):
    help = 'Pull eBay inventory and upsert matching Pokebin products.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Walk eBay items and report counts without writing to the DB.',
        )

    def handle(self, *args, **options):
        service = SyncService(dry_run=options['dry_run'])
        try:
            report = service.sync_all()
        except EbayAuthError as exc:
            raise CommandError(str(exc)) from exc

        styler = self.style.SUCCESS if report.errors == 0 else self.style.WARNING
        self.stdout.write(styler(report.as_text()))
