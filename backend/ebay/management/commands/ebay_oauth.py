"""One-time OAuth bootstrap for the eBay seller account.

Run interactively from a developer machine. The command prints the eBay
consent URL, waits for you to paste back the `code` query param after
granting access, and stores the resulting refresh token in the
`EbayAuthToken` singleton so the cron worker can use it.

Usage:
    python manage.py ebay_oauth
    python manage.py ebay_oauth --code <CODE>     # non-interactive
"""

import datetime as dt

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from ebay.models import EbayAuthToken
from ebay.services import EbayAuthError, EbayClient


class Command(BaseCommand):
    help = 'Run the eBay OAuth consent flow and persist the refresh token.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--code',
            help='Auth code returned by eBay (skip the interactive prompt).',
        )

    def handle(self, *args, **options):
        client = EbayClient()
        url = client.consent_url()

        self.stdout.write('1. Open this URL in a browser logged into the seller eBay account:\n')
        self.stdout.write(self.style.NOTICE(url))
        self.stdout.write(
            '\n2. Approve the requested scopes. eBay will redirect to your RuName URL'
            ' with a `code=...` query parameter.\n'
        )

        code = options.get('code')
        if not code:
            try:
                code = input('Paste the `code` value here: ').strip()
            except EOFError as exc:
                raise CommandError('No code provided.') from exc

        if not code:
            raise CommandError('Empty auth code.')

        try:
            payload = client.exchange_code(code)
        except EbayAuthError as exc:
            raise CommandError(str(exc)) from exc

        now = timezone.now()
        token, _ = EbayAuthToken.objects.get_or_create(pk=1)
        token.refresh_token = payload['refresh_token']
        if 'refresh_token_expires_in' in payload:
            token.refresh_token_expires_at = now + dt.timedelta(
                seconds=int(payload['refresh_token_expires_in'])
            )
        token.access_token = payload.get('access_token', '')
        if 'expires_in' in payload:
            token.access_token_expires_at = now + dt.timedelta(seconds=int(payload['expires_in']))
        if 'scope' in payload:
            token.scope = payload['scope']
        token.save()

        self.stdout.write(self.style.SUCCESS(
            f'\nSaved eBay tokens. Refresh token expires '
            f'{token.refresh_token_expires_at:%Y-%m-%d} '
            f'(access token expires {token.access_token_expires_at:%Y-%m-%d %H:%M}).'
        ))
