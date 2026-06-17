"""Tests for the `ebay_migrate` management command.

The command feeds traditional listing IDs through eBay's bulk_migrate_listing
(5 per call) so they enter the Inventory model and become visible to the sync.
"""

from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

COMMAND_PATH = 'ebay.management.commands.ebay_migrate.EbayClient'


class EbayMigrateCommandTests(TestCase):
    def test_errors_without_listing_ids(self):
        with self.assertRaises(CommandError):
            call_command('ebay_migrate')

    def test_migrates_and_reports_success(self):
        responses = [{'statusCode': 200, 'listingId': '111', 'sku': 'PSA-1', 'offerId': 'of1'}]
        out = StringIO()
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.return_value = responses
            call_command('ebay_migrate', '111', stdout=out)

        value = out.getvalue()
        self.assertIn('111', value)
        self.assertIn('PSA-1', value)
        self.assertIn('Migrated 1', value)

    def test_batches_in_groups_of_five(self):
        ids = [str(100 + n) for n in range(7)]
        with mock.patch(COMMAND_PATH) as Client:
            client = Client.return_value
            client.bulk_migrate_listing.return_value = []
            call_command('ebay_migrate', *ids, stdout=StringIO())

        self.assertEqual(client.bulk_migrate_listing.call_count, 2)
        self.assertEqual(len(client.bulk_migrate_listing.call_args_list[0].args[0]), 5)
        self.assertEqual(len(client.bulk_migrate_listing.call_args_list[1].args[0]), 2)

    def test_reports_per_listing_failures(self):
        responses = [{'statusCode': 400, 'listingId': '222', 'errors': [{'message': 'listing has no SKU'}]}]
        out = StringIO()
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.return_value = responses
            call_command('ebay_migrate', '222', stdout=out)

        value = out.getvalue()
        self.assertIn('222', value)
        self.assertIn('listing has no SKU', value)
        self.assertIn('failed 1', value)

    def test_dedupes_listing_ids(self):
        with mock.patch(COMMAND_PATH) as Client:
            client = Client.return_value
            client.bulk_migrate_listing.return_value = []
            call_command('ebay_migrate', '111', '111', '222', stdout=StringIO())

        self.assertEqual(client.bulk_migrate_listing.call_args_list[0].args[0], ['111', '222'])
