"""Tests for the eBay marketplace account-deletion notification endpoint.

eBay validates this endpoint before granting production keys: it sends a
GET challenge and expects sha256(challengeCode + verificationToken + endpoint)
back, and it POSTs deletion notifications that must be acknowledged with 2xx.
https://developer.ebay.com/develop/guides-v2/marketplace-user-account-deletion
"""

import hashlib
import json

from django.test import TestCase, override_settings
from django.urls import reverse

TOKEN = 'a' * 40  # 32-80 chars, [A-Za-z0-9_-]
ENDPOINT = 'https://pokebin-api.onrender.com/ebay/account-deletion/'


@override_settings(EBAY_VERIFICATION_TOKEN=TOKEN, EBAY_DELETION_ENDPOINT=ENDPOINT)
class AccountDeletionEndpointTests(TestCase):
    def setUp(self):
        self.url = reverse('ebay-account-deletion')

    def test_challenge_returns_expected_sha256(self):
        code = 'challenge-123'
        response = self.client.get(self.url, {'challenge_code': code})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')
        expected = hashlib.sha256((code + TOKEN + ENDPOINT).encode('utf-8')).hexdigest()
        self.assertEqual(response.json()['challengeResponse'], expected)

    def test_challenge_without_code_is_bad_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 400)

    def test_deletion_notification_is_acknowledged(self):
        payload = {
            'metadata': {'topic': 'MARKETPLACE_ACCOUNT_DELETION'},
            'notification': {'data': {'username': 'someone', 'userId': 'abc', 'eiasToken': 'xyz'}},
        }
        response = self.client.post(
            self.url, data=json.dumps(payload), content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)

    @override_settings(EBAY_VERIFICATION_TOKEN='', EBAY_DELETION_ENDPOINT='')
    def test_challenge_unconfigured_is_server_error(self):
        response = self.client.get(self.url, {'challenge_code': 'x'})
        self.assertEqual(response.status_code, 500)
