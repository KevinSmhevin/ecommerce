"""Tests for the `ebay_migrate` management command.

The command feeds traditional listing IDs through eBay's bulk_migrate_listing
(5 per call) so they enter the Inventory model and become visible to the sync.
Fixtures mirror eBay's real response shape: a per-listing `statusCode`, a
top-level `listingId`, and `sku`/`offerId` nested under `inventoryItems[]`.
"""

import os
import tempfile
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from ebay.services import EbayApiError, EbayAuthError

COMMAND_PATH = 'ebay.management.commands.ebay_migrate.EbayClient'


def migrated(listing_id, sku, offer_id):
    return {
        'statusCode': 200,
        'listingId': listing_id,
        'marketplaceId': 'EBAY_US',
        'inventoryItems': [{'sku': sku, 'offerId': offer_id}],
    }


def failed(listing_id, message):
    return {
        'statusCode': 400,
        'listingId': listing_id,
        'marketplaceId': 'EBAY_US',
        'errors': [{'errorId': 25718, 'message': message}],
    }


class EbayMigrateCommandTests(TestCase):
    def test_errors_without_listing_ids(self):
        with self.assertRaises(CommandError):
            call_command('ebay_migrate')

    def test_migrates_and_reports_nested_sku_and_offer(self):
        out = StringIO()
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.return_value = [migrated('111', 'PSA-1', 'of1')]
            call_command('ebay_migrate', '111', stdout=out)

        value = out.getvalue()
        self.assertIn('111', value)
        self.assertIn('PSA-1', value)
        self.assertIn('of1', value)
        self.assertIn('Migrated 1', value)

    def test_207_mixed_results_counts_both(self):
        out = StringIO()
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.return_value = [
                migrated('111', 'PSA-1', 'of1'),
                failed('222', 'listing has no SKU'),
            ]
            with self.assertRaises(CommandError):
                call_command('ebay_migrate', '111', '222', stdout=out)

        value = out.getvalue()
        self.assertIn('listing has no SKU', value)
        self.assertIn('Migrated 1, failed 1', value)

    def test_exits_nonzero_when_a_listing_fails(self):
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.return_value = [failed('222', 'no sku')]
            with self.assertRaises(CommandError):
                call_command('ebay_migrate', '222', stdout=StringIO())

    def test_full_success_does_not_raise(self):
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.return_value = [migrated('111', 'PSA-1', 'of1')]
            call_command('ebay_migrate', '111', stdout=StringIO())  # no CommandError

    def test_file_with_utf8_bom_is_read_without_corrupting_first_id(self):
        with tempfile.NamedTemporaryFile(
            'w', suffix='.txt', delete=False, encoding='utf-8-sig'
        ) as handle:
            handle.write('111\n222\n')  # utf-8-sig prepends a BOM
            path = handle.name
        try:
            with mock.patch(COMMAND_PATH) as Client:
                client = Client.return_value
                client.bulk_migrate_listing.return_value = []
                call_command('ebay_migrate', '--file', path, stdout=StringIO())
            self.assertEqual(client.bulk_migrate_listing.call_args_list[0].args[0], ['111', '222'])
        finally:
            os.unlink(path)

    def test_batches_in_groups_of_five(self):
        ids = [str(100 + n) for n in range(7)]
        with mock.patch(COMMAND_PATH) as Client:
            client = Client.return_value
            client.bulk_migrate_listing.return_value = []
            call_command('ebay_migrate', *ids, stdout=StringIO())

        self.assertEqual(client.bulk_migrate_listing.call_count, 2)
        self.assertEqual(len(client.bulk_migrate_listing.call_args_list[0].args[0]), 5)
        self.assertEqual(len(client.bulk_migrate_listing.call_args_list[1].args[0]), 2)

    def test_dedupes_listing_ids(self):
        with mock.patch(COMMAND_PATH) as Client:
            client = Client.return_value
            client.bulk_migrate_listing.return_value = []
            call_command('ebay_migrate', '111', '111', '222', stdout=StringIO())

        self.assertEqual(client.bulk_migrate_listing.call_args_list[0].args[0], ['111', '222'])

    def test_api_error_on_one_batch_still_reports_the_others(self):
        """A transport failure on one batch must not discard the migrations a
        prior/later batch completed; the failed batch's listings are reported,
        not silently dropped."""
        ids = [str(100 + n) for n in range(7)]  # batch1: 5, batch2: 2
        out = StringIO()
        with mock.patch(COMMAND_PATH) as Client:
            client = Client.return_value
            client.bulk_migrate_listing.side_effect = [
                EbayApiError('eBay /bulk_migrate_listing returned 500: boom'),
                [migrated('105', 'PSA-9', 'of9'), migrated('106', 'PSA-10', 'of10')],
            ]
            with self.assertRaises(CommandError):
                call_command('ebay_migrate', *ids, stdout=out)

        value = out.getvalue()
        self.assertIn('Migrated 2, failed 5', value)
        self.assertIn('100', value)  # a listing from the failed first batch is still reported

    def test_auth_error_aborts_the_run(self):
        with mock.patch(COMMAND_PATH) as Client:
            Client.return_value.bulk_migrate_listing.side_effect = EbayAuthError('no token')
            with self.assertRaises(CommandError):
                call_command('ebay_migrate', '111', stdout=StringIO())
