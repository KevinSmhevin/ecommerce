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

    def test_refresh_requests_the_granted_scope_not_the_default(self):
        """A token minted under readonly must refresh under readonly: eBay
        rejects a refresh that tries to broaden scope, so we echo what was
        granted rather than the (now write) DEFAULT_SCOPES."""
        granted = 'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly'
        self._token(
            access_token='stale-tok',
            access_token_expires_at=timezone.now() - dt.timedelta(minutes=1),
            scope=granted,
        )
        client = EbayClient(env='sandbox')
        with mock.patch.object(
            client, 'refresh_access_token',
            return_value={'access_token': 'fresh-tok', 'expires_in': 7200},
        ) as refresh:
            client.ensure_access_token()

        self.assertEqual(refresh.call_args.args[1], [granted])

    def test_refresh_omits_scope_for_legacy_token_without_recorded_scope(self):
        self._token(
            access_token='stale-tok',
            access_token_expires_at=timezone.now() - dt.timedelta(minutes=1),
            scope='',
        )
        client = EbayClient(env='sandbox')
        with mock.patch.object(client, '_token_request', return_value={
            'access_token': 'fresh-tok', 'expires_in': 7200,
        }) as token_request:
            client.ensure_access_token()

        self.assertNotIn('scope', token_request.call_args.args[0])

    def test_raises_without_refresh_token(self):
        client = EbayClient(env='sandbox')
        with self.assertRaises(EbayAuthError):
            client.ensure_access_token()


class RefreshAccessTokenScopeTests(TestCase):
    def test_includes_scope_when_given(self):
        client = EbayClient(env='sandbox')
        with mock.patch.object(client, '_token_request', return_value={}) as token_request:
            client.refresh_access_token('rt', scopes=['scope-a', 'scope-b'])
        self.assertEqual(token_request.call_args.args[0]['scope'], 'scope-a scope-b')

    def test_omits_scope_when_none(self):
        client = EbayClient(env='sandbox')
        with mock.patch.object(client, '_token_request', return_value={}) as token_request:
            client.refresh_access_token('rt', scopes=None)
        self.assertNotIn('scope', token_request.call_args.args[0])


class BulkMigrateListingTests(TestCase):
    """`bulk_migrate_listing` converts traditional listings into the Inventory
    model. eBay caps it at 5 listings per call and returns a per-listing
    `responses` array. The overall HTTP status is 200 when every listing
    migrates and 207 Multi-Status when results are mixed."""

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
        body = {'responses': [
            {'statusCode': 200, 'listingId': '111', 'marketplaceId': 'EBAY_US',
             'inventoryItems': [{'sku': 'PSA-1', 'offerId': 'of1'}]},
        ]}
        with mock.patch.object(
            client._session, 'request', return_value=self._response(200, body)
        ) as request:
            responses = client.bulk_migrate_listing(['111'])

        request.assert_called_once()
        self.assertEqual(request.call_args.args[0], 'POST')
        self.assertEqual(request.call_args.kwargs['json'], {'requests': [{'listingId': '111'}]})
        self.assertEqual(responses[0]['inventoryItems'][0]['sku'], 'PSA-1')

    def test_207_multi_status_returns_body_without_raising(self):
        """A partial success (some migrated, some failed) comes back as 207 —
        the per-item statusCodes carry the individual results, so the call must
        not raise."""
        client = self._client()
        body = {'responses': [
            {'statusCode': 200, 'listingId': '111', 'marketplaceId': 'EBAY_US',
             'inventoryItems': [{'sku': 'PSA-1', 'offerId': 'of1'}]},
            {'statusCode': 400, 'marketplaceId': 'EBAY_US',
             'errors': [{'errorId': 25001, 'message': 'item sku cannot be null or empty.'}]},
        ]}
        with mock.patch.object(
            client._session, 'request', return_value=self._response(207, body)
        ):
            responses = client.bulk_migrate_listing(['111', '222'])

        self.assertEqual(len(responses), 2)
        self.assertEqual(responses[0]['statusCode'], 200)
        self.assertEqual(responses[1]['statusCode'], 400)

    def test_empty_list_makes_no_call(self):
        client = self._client()
        with mock.patch.object(client._session, 'request') as request:
            self.assertEqual(client.bulk_migrate_listing([]), [])
        request.assert_not_called()

    def test_rejects_more_than_five(self):
        client = self._client()
        with self.assertRaises(ValueError):
            client.bulk_migrate_listing([str(n) for n in range(6)])

    def test_raises_on_transport_error(self):
        client = self._client()
        with mock.patch.object(
            client._session, 'request', return_value=self._response(400, {'error': 'bad'})
        ):
            with self.assertRaises(EbayApiError):
                client.bulk_migrate_listing(['111'])
