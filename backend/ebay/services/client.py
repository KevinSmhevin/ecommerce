"""eBay REST client.

Scope of this module: OAuth (authorization-code grant + refresh) for the
seller's own account, plus a thin `request()` helper that future modules
(sync pipeline, store-category lookup) will build on.

eBay's OAuth endpoints differ between sandbox and production but share the
same path; we pick the host based on `settings.EBAY_ENV`.
"""

from __future__ import annotations

import base64
import datetime as dt
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.utils import timezone


class EbayAuthError(RuntimeError):
    """Raised when an OAuth exchange or refresh fails."""


class EbayApiError(RuntimeError):
    """Raised when an authenticated REST call fails."""


# Default scopes the sync worker needs. `sell.inventory.readonly` lets us
# read the seller's inventory items; we keep it tight (no write scope) to
# match the v1 plan of one-way sync.
DEFAULT_SCOPES = [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
]


@dataclass(frozen=True)
class EbayHosts:
    api: str
    auth: str

    @classmethod
    def for_env(cls, env: str) -> 'EbayHosts':
        if env == 'production':
            return cls(api='https://api.ebay.com', auth='https://auth.ebay.com')
        # Default to sandbox so a missing/typo'd EBAY_ENV can't hit production.
        return cls(api='https://api.sandbox.ebay.com', auth='https://auth.sandbox.ebay.com')


class EbayClient:
    """Thin OAuth-aware client.

    Persists tokens through the `EbayAuthToken` singleton; callers go through
    `ensure_access_token()` to get a valid bearer for subsequent REST calls.
    """

    # 60-second safety margin: refresh slightly before eBay reports expiry to
    # avoid a 401 from clock skew between us and eBay.
    _ACCESS_TOKEN_REFRESH_LEEWAY = dt.timedelta(seconds=60)

    def __init__(self, env: Optional[str] = None):
        self.env = env or settings.EBAY_ENV
        self.hosts = EbayHosts.for_env(self.env)
        self.app_id = settings.EBAY_APP_ID
        self.cert_id = settings.EBAY_CERT_ID
        self.ru_name = settings.EBAY_RU_NAME

    # -- OAuth: authorization code grant ---------------------------------

    def consent_url(self, scopes: Optional[list[str]] = None, state: Optional[str] = None) -> str:
        """Build the URL the seller visits to grant consent.

        eBay returns the auth code to the configured RuName redirect.
        """
        if not self.app_id or not self.ru_name:
            raise EbayAuthError(
                'EBAY_APP_ID and EBAY_RU_NAME must be set before requesting consent.'
            )
        params = {
            'client_id': self.app_id,
            'response_type': 'code',
            'redirect_uri': self.ru_name,
            'scope': ' '.join(scopes or DEFAULT_SCOPES),
        }
        if state:
            params['state'] = state
        return f'{self.hosts.auth}/oauth2/authorize?{urlencode(params)}'

    def exchange_code(self, code: str) -> dict:
        """Exchange a one-time auth code for access + refresh tokens."""
        return self._token_request({
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.ru_name,
        })

    def refresh_access_token(self, refresh_token: str, scopes: Optional[list[str]] = None) -> dict:
        """Mint a new access token from a long-lived refresh token."""
        return self._token_request({
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'scope': ' '.join(scopes or DEFAULT_SCOPES),
        })

    # -- Persistent token management -------------------------------------

    def ensure_access_token(self) -> str:
        """Return a valid access token, refreshing if needed.

        Reads/writes the `EbayAuthToken` singleton. Raises `EbayAuthError`
        if no refresh token has been minted yet (run `manage.py ebay_oauth`).
        """
        from ebay.models import EbayAuthToken

        token = EbayAuthToken.objects.first()
        if token is None or not token.refresh_token:
            raise EbayAuthError(
                'No eBay refresh token on file. Run `python manage.py ebay_oauth` first.'
            )

        now = timezone.now()
        cached_expiry = token.access_token_expires_at
        if (
            token.access_token
            and cached_expiry
            and cached_expiry - self._ACCESS_TOKEN_REFRESH_LEEWAY > now
        ):
            return token.access_token

        payload = self.refresh_access_token(token.refresh_token)
        token.access_token = payload['access_token']
        token.access_token_expires_at = now + dt.timedelta(seconds=int(payload['expires_in']))
        if 'scope' in payload:
            token.scope = payload['scope']
        token.save(update_fields=['access_token', 'access_token_expires_at', 'scope', 'updated_at'])
        return token.access_token

    # -- Internals -------------------------------------------------------

    def _token_request(self, data: dict) -> dict:
        if not self.app_id or not self.cert_id:
            raise EbayAuthError('EBAY_APP_ID and EBAY_CERT_ID must be set.')

        basic = base64.b64encode(f'{self.app_id}:{self.cert_id}'.encode()).decode()
        resp = requests.post(
            f'{self.hosts.api}/identity/v1/oauth2/token',
            headers={
                'Authorization': f'Basic {basic}',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data=data,
            timeout=15,
        )
        if resp.status_code != 200:
            raise EbayAuthError(
                f'eBay token endpoint returned {resp.status_code}: {resp.text[:500]}'
            )
        return resp.json()
