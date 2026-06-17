"""Verify the `x-ebay-signature` header on eBay notification POSTs.

eBay signs notifications with ECDSA/SHA1. The header is a base64-packed JSON
carrying the signature and the id (`kid`) of the public key to verify it; the
key is fetched from the Notification API and cached.
https://developer.ebay.com/api-docs/commerce/notification/static/overview.html
"""

import base64
import json
import logging
from typing import Optional

import requests
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.core.cache import cache

from .client import EbayClient

logger = logging.getLogger(__name__)

# eBay recommends caching each public key for ~1 hour.
_PUBLIC_KEY_CACHE_TTL = 3600


def verify_ebay_signature(signature_header: str, body: bytes) -> bool:
    """True if `body` carries a valid eBay ECDSA/SHA1 signature."""
    meta = _decode_header(signature_header)
    if meta is None:
        return False

    kid = meta.get('kid')
    encoded_signature = meta.get('signature')
    if not kid or not encoded_signature:
        logger.warning('eBay signature header missing kid/signature')
        return False

    pem = _public_key_pem(kid)
    if pem is None:
        return False

    try:
        public_key = serialization.load_pem_public_key(pem.encode('utf-8'))
        public_key.verify(
            base64.b64decode(encoded_signature),
            body,
            ec.ECDSA(hashes.SHA1()),
        )
        return True
    except (InvalidSignature, ValueError) as exc:
        logger.warning('eBay signature verification failed: %s', exc)
        return False


def _decode_header(signature_header: str) -> Optional[dict]:
    if not signature_header:
        return None
    try:
        return json.loads(base64.b64decode(signature_header))
    except (ValueError, json.JSONDecodeError):
        logger.warning('eBay signature header is not base64 JSON')
        return None


def _public_key_pem(kid: str) -> Optional[str]:
    cache_key = f'ebay_public_key:{kid}'
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        key = _fetch_public_key(kid)
    except Exception as exc:  # noqa: BLE001 — never let a fetch error 500 the webhook
        logger.warning('eBay getPublicKey failed for kid=%s: %s', kid, exc)
        return None
    pem = _ensure_pem(key)
    cache.set(cache_key, pem, _PUBLIC_KEY_CACHE_TTL)
    return pem


def _fetch_public_key(kid: str) -> str:
    client = EbayClient()
    token = client.get_application_token()
    resp = requests.get(
        f'{client.hosts.api}/commerce/notification/v1/public_key/{kid}',
        headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
        timeout=15,
    )
    if resp.status_code != 200:
        raise RuntimeError(f'getPublicKey {resp.status_code}: {resp.text[:300]}')
    return resp.json()['key']


def _ensure_pem(key: str) -> str:
    """eBay may return the key bare (base64 DER) or already PEM-wrapped."""
    if 'BEGIN PUBLIC KEY' in key:
        return key
    lines = '\n'.join(key[i:i + 64] for i in range(0, len(key), 64))
    return f'-----BEGIN PUBLIC KEY-----\n{lines}\n-----END PUBLIC KEY-----'
