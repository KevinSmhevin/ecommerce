"""Tests for the EbayListing admin "Sync now" action.

This is the primary way the seller triggers a sync (no cron worker), so the
view must degrade gracefully: a failing sync should surface as an admin
message and a redirect, never a 500.
"""

from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.test import TestCase
from django.urls import reverse

from ebay.services import EbayApiError, EbayAuthError, SyncReport


class SyncNowAdminViewTests(TestCase):
    def setUp(self):
        self.url = reverse('admin:ebay_ebaylisting_sync_now')
        self.changelist_url = reverse('admin:ebay_ebaylisting_changelist')
        admin = get_user_model().objects.create_superuser(
            username='boss', email='boss@pokebin.app', password='secret-pw',
        )
        self.client.force_login(admin)

    def _messages(self, response):
        return [m.message for m in get_messages(response.wsgi_request)]

    def test_api_error_shows_message_instead_of_500(self):
        with mock.patch('ebay.admin.SyncService') as service_cls:
            service_cls.return_value.sync_all.side_effect = EbayApiError(
                'eBay /sell/inventory returned 500: upstream boom'
            )
            response = self.client.post(self.url)

        self.assertRedirects(response, self.changelist_url, fetch_redirect_response=False)
        self.assertTrue(
            any('upstream boom' in m for m in self._messages(response)),
            self._messages(response),
        )

    def test_auth_error_shows_message_instead_of_500(self):
        with mock.patch('ebay.admin.SyncService') as service_cls:
            service_cls.return_value.sync_all.side_effect = EbayAuthError(
                'No eBay refresh token on file.'
            )
            response = self.client.post(self.url)

        self.assertRedirects(response, self.changelist_url, fetch_redirect_response=False)
        self.assertTrue(
            any('refresh token' in m for m in self._messages(response)),
            self._messages(response),
        )

    def test_post_runs_sync_and_reports_counts(self):
        report = SyncReport(created=2, updated=1, skipped=3, errors=0)
        with mock.patch('ebay.admin.SyncService') as service_cls:
            service_cls.return_value.sync_all.return_value = report
            response = self.client.post(self.url)

        service_cls.return_value.sync_all.assert_called_once_with()
        self.assertRedirects(response, self.changelist_url, fetch_redirect_response=False)
        self.assertTrue(
            any('created=2' in m and 'updated=1' in m for m in self._messages(response)),
            self._messages(response),
        )

    def test_get_does_not_run_sync(self):
        with mock.patch('ebay.admin.SyncService') as service_cls:
            response = self.client.get(self.url)

        service_cls.return_value.sync_all.assert_not_called()
        self.assertRedirects(response, self.changelist_url, fetch_redirect_response=False)


class SyncNowPermissionTests(TestCase):
    def setUp(self):
        self.url = reverse('admin:ebay_ebaylisting_sync_now')
        staff_without_perm = get_user_model().objects.create_user(
            username='clerk',
            email='clerk@pokebin.app',
            password='secret-pw',
            is_staff=True,
        )
        self.client.force_login(staff_without_perm)

    def test_staff_without_change_permission_cannot_run_sync(self):
        with mock.patch('ebay.admin.SyncService') as service_cls:
            response = self.client.post(self.url)

        self.assertEqual(response.status_code, 403)
        service_cls.return_value.sync_all.assert_not_called()
