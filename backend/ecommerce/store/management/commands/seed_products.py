from django.core.management.base import BaseCommand

from store.models import Category, Product


class Command(BaseCommand):
    help = "Seed the database with sample categories and products for local development."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Seeding sample categories and products..."))

        categories_data = [
            {"name": "Cards", "slug": "cards"},
            {"name": "Plushies", "slug": "plushies"},
            {"name": "Accessories", "slug": "accessories"},
        ]

        categories = {}
        for data in categories_data:
            category, _ = Category.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"]},
            )
            categories[data["slug"]] = category

        products_data = [
            {
                "title": "Charizard EX Holographic",
                "brand": "Pokebin",
                "description": "Premium Charizard EX holographic card in mint condition.",
                "slug": "charizard-ex-holographic",
                "price": "149.99",
                "category_slug": "cards",
                "stock": 10,
                "image": "images/RayquazaPonchoPikachu.jpg",
            },
            {
                "title": "Pikachu Plush (Large)",
                "brand": "Pokebin",
                "description": "Soft and cuddly Pikachu plush, 18 inches tall.",
                "slug": "pikachu-plush-large",
                "price": "39.99",
                "category_slug": "plushies",
                "stock": 25,
                "image": "images/poncho_pikachu_rayquaza_1.jpg",
            },
            {
                "title": "Pokeball Keychain",
                "brand": "Pokebin",
                "description": "Metal Pokeball keychain with glossy finish.",
                "slug": "pokeball-keychain",
                "price": "9.99",
                "category_slug": "accessories",
                "stock": 100,
                "image": "images/Fire_Nation_Aang_2.jpg",
            },
        ]

        created_count = 0

        for data in products_data:
            category = categories.get(data["category_slug"])

            product, created = Product.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "category": category,
                    "title": data["title"],
                    "brand": data["brand"],
                    "description": data["description"],
                    "price": data["price"],
                    # Use a placeholder image that exists in your static/media folder.
                    "image": data["image"],
                    "stock": data["stock"],
                },
            )

            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created {created_count} products."))

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from store.models import Category, Product


class Command(BaseCommand):
    help = "Seed the database with sample categories and products for local development."

    def handle(self, *args, **options):
        # Only run this against a local/dev database you control.
        self.stdout.write(self.style.WARNING("Seeding sample categories and products..."))

        # Simple guard: don't duplicate if we already seeded once.
        if Product.objects.exists():
            self.stdout.write(self.style.WARNING("Products already exist; skipping seed."))
            return

        categories_data = [
            {"name": "Cards", "slug": "cards"},
            {"name": "Plushies", "slug": "plushies"},
            {"name": "Accessories", "slug": "accessories"},
        ]

        categories = {}
        for data in categories_data:
            category, _ = Category.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"]},
            )
            categories[data["slug"]] = category

        products_data = [
            {
                "title": "Charizard EX Holographic",
                "brand": "Pokebin",
                "description": "Premium Charizard EX holographic card in mint condition.",
                "slug": "charizard-ex-holographic",
                "price": "149.99",
                "category_slug": "cards",
                "stock": 10,
            },
            {
                "title": "Pikachu Plush (Large)",
                "brand": "Pokebin",
                "description": "Soft and cuddly Pikachu plush, 18 inches tall.",
                "slug": "pikachu-plush-large",
                "price": "39.99",
                "category_slug": "plushies",
                "stock": 25,
            },
            {
                "title": "Pokeball Keychain",
                "brand": "Pokebin",
                "description": "Metal Pokeball keychain with glossy finish.",
                "slug": "pokeball-keychain",
                "price": "9.99",
                "category_slug": "accessories",
                "stock": 100,
            },
        ]

        created_count = 0

        for data in products_data:
            category = categories.get(data["category_slug"])

            product, created = Product.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "category": category,
                    "title": data["title"],
                    "brand": data["brand"],
                    "description": data["description"],
                    "price": data["price"],
                    # Use placeholder image path that matches your MEDIA_ROOT setup.
                    "image": "images/RayquazaPonchoPikachu.jpg",
                    "stock": data["stock"],
                },
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created {created_count} products."))


