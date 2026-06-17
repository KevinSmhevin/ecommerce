"""Tests for eBay notification signature verification (ECDSA/SHA1).

A real eBay signature can't be reproduced offline, so these generate an EC
keypair, sign a body the same way eBay does (DER ECDSA over the raw body with
SHA1), and stub the public-key fetch — exercising the actual verify path.
"""

import base64
import json
from unittest import mock

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.core.cache import cache
from django.test import TestCase

from ebay.services.signature import verify_ebay_signature


class VerifyEbaySignatureTests(TestCase):
    def setUp(self):
        cache.clear()
        self.private_key = ec.generate_private_key(ec.SECP256R1())
        self.pem = self.private_key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

    def _header(self, signature: bytes, kid='kid-1') -> str:
        packed = json.dumps({
            'alg': 'ecdsa',
            'kid': kid,
            'digest': 'SHA1',
            'signature': base64.b64encode(signature).decode(),
        })
        return base64.b64encode(packed.encode()).decode()

    def test_valid_signature_passes(self):
        body = b'{"notification":"account_deletion"}'
        signature = self.private_key.sign(body, ec.ECDSA(hashes.SHA1()))
        with mock.patch('ebay.services.signature._fetch_public_key', return_value=self.pem):
            self.assertTrue(verify_ebay_signature(self._header(signature), body))

    def test_tampered_body_fails(self):
        signature = self.private_key.sign(b'original-body', ec.ECDSA(hashes.SHA1()))
        with mock.patch('ebay.services.signature._fetch_public_key', return_value=self.pem):
            self.assertFalse(verify_ebay_signature(self._header(signature), b'tampered-body'))

    def test_base64_der_key_without_pem_headers_is_accepted(self):
        der_b64 = ''.join(self.pem.strip().splitlines()[1:-1])
        body = b'{"a":1}'
        signature = self.private_key.sign(body, ec.ECDSA(hashes.SHA1()))
        with mock.patch('ebay.services.signature._fetch_public_key', return_value=der_b64):
            self.assertTrue(verify_ebay_signature(self._header(signature), body))

    def test_missing_header_fails(self):
        self.assertFalse(verify_ebay_signature('', b'x'))

    def test_garbage_header_fails(self):
        self.assertFalse(verify_ebay_signature('!!!not-base64-json', b'x'))

    def test_unfetchable_key_fails(self):
        signature = self.private_key.sign(b'x', ec.ECDSA(hashes.SHA1()))
        with mock.patch('ebay.services.signature._fetch_public_key', side_effect=Exception('boom')):
            self.assertFalse(verify_ebay_signature(self._header(signature), b'x'))
