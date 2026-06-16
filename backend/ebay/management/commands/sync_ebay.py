"""Sync the seller's eBay inventory into the Pokebin catalog.

Designed to run on a Render cron schedule. Safe to invoke manually:
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
