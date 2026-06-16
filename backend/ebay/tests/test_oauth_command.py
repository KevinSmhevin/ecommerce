"""Tests for the ebay_oauth auth-code normalisation.

eBay returns the authorization code URL-encoded in the browser's address
bar. The command should accept whatever the seller pastes — the full
redirect URL, the raw encoded code, or an already-decoded code — and hand
a clean decoded code to the token exchange.
"""

from django.test import TestCase

from ebay.management.commands.ebay_oauth import extract_auth_code

DECODED = 'v^1.1#i^1#f^0#I^3#r^1#p^3#t^Ul41XzU6MkU1MkI0REJGNDM2MzAxRTc5NkIzQUEyRTg4MTEyRkFfMV8xI0VeMTI4NA=='
ENCODED = ('v%5E1.1%23i%5E1%23f%5E0%23I%5E3%23r%5E1%23p%5E3%23t%5E'
           'Ul41XzU6MkU1MkI0REJGNDM2MzAxRTc5NkIzQUEyRTg4MTEyRkFfMV8xI0VeMTI4NA%3D%3D')


class ExtractAuthCodeTests(TestCase):
    def test_full_redirect_url_yields_decoded_code(self):
        url = f'https://www.pokebin.app/ebay-oauth/declined?code={ENCODED}&expires_in=299'
        self.assertEqual(extract_auth_code(url), DECODED)

    def test_encoded_bare_code_is_decoded(self):
        self.assertEqual(extract_auth_code(ENCODED), DECODED)

    def test_already_decoded_code_is_unchanged(self):
        self.assertEqual(extract_auth_code(DECODED), DECODED)

    def test_surrounding_whitespace_is_stripped(self):
        self.assertEqual(extract_auth_code(f'  {DECODED}  \n'), DECODED)

    def test_query_string_without_scheme_yields_decoded_code(self):
        self.assertEqual(extract_auth_code(f'code={ENCODED}&expires_in=299'), DECODED)
