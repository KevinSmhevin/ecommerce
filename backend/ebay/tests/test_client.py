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
from ebay.services.client import EbayAuthError, EbayClient


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
