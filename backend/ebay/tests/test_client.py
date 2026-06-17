"""Tests for EbayClient.ensure_access_token caching.

The sync makes one authenticated GET per inventory page and per SKU, all
through `ensure_access_token`. It must not re-read the token row from the DB
(or refresh) on every call when the in-memory token is still valid.
"""

import datetime as dt
from unittest import mock

from django.test import TestCase
from django.utils import timezone

from ebay.models import EbayAuthToken
from ebay.services.client import EbayApiError, EbayAuthError, EbayClient


class EnsureAccessTokenTests(TestCase):
    def _token(self, **overrides):
        defaults = dict(
            refresh_token='refresh-tok',
            access_token='valid-tok',
            access_token_expires_at=timezone.now() + dt.timedelta(hours=1),
        )
        defaults.update(overrides)
        return EbayAuthToken.objects.create(**defaults)

    def test_token_cached_in_memory_after_first_read(self):
        self._token()
        client = EbayClient(env='sandbox')
        with self.assertNumQueries(1):
            first = client.ensure_access_token()
            second = client.ensure_access_token()
        self.assertEqual(first, 'valid-tok')
        self.assertEqual(second, 'valid-tok')

    def test_refreshes_and_persists_when_expired(self):
        self._token(
            access_token='stale-tok',
            access_token_expires_at=timezone.now() - dt.timedelta(minutes=1),
        )
        client = EbayClient(env='sandbox')
        with mock.patch.object(
            client, 'refresh_access_token',
            return_value={'access_token': 'fresh-tok', 'expires_in': 7200},
        ) as refresh:
            token = client.ensure_access_token()

        refresh.assert_called_once()
        self.assertEqual(token, 'fresh-tok')
        self.assertEqual(EbayAuthToken.objects.first().access_token, 'fresh-tok')

    def test_raises_without_refresh_token(self):
        client = EbayClient(env='sandbox')
        with self.assertRaises(EbayAuthError):
            client.ensure_access_token()


class BulkMigrateListingTests(TestCase):
    """`bulk_migrate_listing` converts traditional listings into the Inventory
    model. eBay caps it at 5 listings per call and returns a per-listing
    `responses` array."""

    def _client(self):
        client = EbayClient(env='production')
        client.ensure_access_token = mock.Mock(return_value='tok')
        return client

    @staticmethod
    def _response(status_code, body):
        resp = mock.Mock(status_code=status_code)
        resp.json.return_value = body
        resp.text = str(body)
        return resp

    def test_posts_listing_ids_and_returns_responses(self):
        client = self._client()
        body = {'responses': [{'statusCode': 200, 'listingId': '111', 'sku': 'PSA-1'}]}
        with mock.patch.object(
            client._session, 'post', return_value=self._response(200, body)
        ) as post:
            responses = client.bulk_migrate_listing(['111'])

        post.assert_called_once()
        self.assertEqual(post.call_args.kwargs['json'], {'requests': [{'listingId': '111'}]})
        self.assertEqual(responses[0]['sku'], 'PSA-1')

    def test_empty_list_makes_no_call(self):
        client = self._client()
        with mock.patch.object(client._session, 'post') as post:
            self.assertEqual(client.bulk_migrate_listing([]), [])
        post.assert_not_called()

    def test_rejects_more_than_five(self):
        client = self._client()
        with self.assertRaises(ValueError):
            client.bulk_migrate_listing([str(n) for n in range(6)])

    def test_raises_on_http_error(self):
        client = self._client()
        with mock.patch.object(
            client._session, 'post', return_value=self._response(400, {'error': 'bad'})
        ):
            with self.assertRaises(EbayApiError):
                client.bulk_migrate_listing(['111'])
