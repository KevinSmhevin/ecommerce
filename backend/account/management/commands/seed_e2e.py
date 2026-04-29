"""
Seed deterministic data for the Playwright e2e suite.

Idempotent: safe to run repeatedly. Resets the seeded user's password and shipping
address each time so tests start from a known state. Creates one seeded order
referenced by check-order.spec.ts so the order-lookup flow has something to find.

Usage:
    python manage.py seed_e2e

Run AFTER `seed_products` so the order has a real product to attach.
"""

from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from payment.models import Order, OrderItem, ShippingAddress
from store.models import Product


# These constants are also referenced in frontend/e2e/fixtures/test-data.ts —
# keep both files in sync if you change them.
E2E_USERNAME = "e2e_user"
E2E_EMAIL = "e2e_user@pokebin.test"
E2E_PASSWORD = "P0kebin!E2E_test"

E2E_INACTIVE_USERNAME = "e2e_inactive"
E2E_INACTIVE_EMAIL = "e2e_inactive@pokebin.test"
E2E_INACTIVE_PASSWORD = "P0kebin!E2E_test"

E2E_SHIPPING = {
    "full_name": "E2E Tester",
    "email": E2E_EMAIL,
    "address1": "100 Test Lane",
    "address2": "Suite 42",
    "city": "Testville",
    "state": "CA",
    "zipcode": "90001",
}

# Used by check-order.spec.ts. Stored on the Order so a guest can look it up by
# (id, email).
E2E_GUEST_ORDER_EMAIL = "guest_order@pokebin.test"


class Command(BaseCommand):
    help = "Seed deterministic users, shipping address, and an order for Playwright e2e tests."

    @transaction.atomic
    def handle(self, *args, **options):
        # 1) Active verified user with a fixed password.
        active_user, _ = User.objects.update_or_create(
            username=E2E_USERNAME,
            defaults={"email": E2E_EMAIL, "is_active": True},
        )
        active_user.set_password(E2E_PASSWORD)
        active_user.is_active = True
        active_user.save()

        # 2) Inactive user (registration-pending) — used to assert the
        #    "account not active" rejection path.
        inactive_user, _ = User.objects.update_or_create(
            username=E2E_INACTIVE_USERNAME,
            defaults={"email": E2E_INACTIVE_EMAIL, "is_active": False},
        )
        inactive_user.set_password(E2E_INACTIVE_PASSWORD)
        inactive_user.is_active = False
        inactive_user.save()

        # 3) Saved shipping address for the active user (single-record per user
        #    via api_manage_shipping; we mirror that contract here).
        ShippingAddress.objects.filter(user=active_user).delete()
        ShippingAddress.objects.create(user=active_user, **E2E_SHIPPING)

        # 4) Seeded guest order for the order-lookup test. Only created once;
        #    we store its id in the response so the test can read it.
        product = Product.objects.filter(stock__gt=0).order_by("pk").first()
        if product is None:
            self.stdout.write(
                self.style.ERROR(
                    "No products in stock — run `python manage.py seed_products` first."
                )
            )
            return

        # Recreate a single guest order so its id is stable enough to discover
        # via stdout. Tests read the latest order for E2E_GUEST_ORDER_EMAIL.
        Order.objects.filter(email=E2E_GUEST_ORDER_EMAIL).delete()
        order = Order.objects.create(
            full_name="Guest Buyer",
            email=E2E_GUEST_ORDER_EMAIL,
            shipping_address="200 Guest Ave\nGuesttown\nNV\n89000",
            amount_paid=Decimal(product.price) * 2,
            user=None,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=2,
            price=product.price,
            user=None,
        )

        self.stdout.write(self.style.SUCCESS(f"E2E_USER_ID={active_user.id}"))
        self.stdout.write(self.style.SUCCESS(f"E2E_GUEST_ORDER_ID={order.id}"))
        self.stdout.write(
            self.style.SUCCESS(
                "Seeded: active user, inactive user, shipping address, guest order."
            )
        )
