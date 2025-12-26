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
            {"name": "Funko Pops", "slug": "funko-pops"},
            {"name": "Trading Cards", "slug": "trading-cards"},
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
                "description": "Premium Charizard EX holographic card in mint condition. This rare card features stunning holographic artwork and is perfect for collectors.",
                "slug": "charizard-ex-holographic",
                "price": "149.99",
                "category_slug": "cards",
                "stock": 10,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",  # Using same image for testing
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Pikachu Plush (Large)",
                "brand": "Pokebin",
                "description": "Soft and cuddly Pikachu plush, 18 inches tall. Made with premium materials and perfect for Pokemon fans of all ages.",
                "slug": "pikachu-plush-large",
                "price": "39.99",
                "category_slug": "plushies",
                "stock": 25,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Pokeball Keychain",
                "brand": "Pokebin",
                "description": "Metal Pokeball keychain with glossy finish. Durable and stylish accessory for any Pokemon trainer.",
                "slug": "pokeball-keychain",
                "price": "9.99",
                "category_slug": "accessories",
                "stock": 100,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Pikachu Funko Pop",
                "brand": "Pokebin",
                "description": "Official Pikachu Funko Pop vinyl figure. Collectible and display-ready with detailed design.",
                "slug": "pikachu-funko-pop",
                "price": "14.99",
                "category_slug": "funko-pops",
                "stock": 50,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Charizard Funko Pop",
                "brand": "Pokebin",
                "description": "Rare Charizard Funko Pop figure with flame effects. A must-have for any Pokemon collector.",
                "slug": "charizard-funko-pop",
                "price": "24.99",
                "category_slug": "funko-pops",
                "stock": 15,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Mewtwo Funko Pop",
                "brand": "Pokebin",
                "description": "Legendary Mewtwo Funko Pop with psychic effects. Limited edition collectible.",
                "slug": "mewtwo-funko-pop",
                "price": "29.99",
                "category_slug": "funko-pops",
                "stock": 8,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Base Set Charizard",
                "brand": "Pokebin",
                "description": "Original Base Set Charizard card in excellent condition. One of the most sought-after Pokemon cards.",
                "slug": "base-set-charizard",
                "price": "299.99",
                "category_slug": "trading-cards",
                "stock": 3,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Pikachu Illustrator Card",
                "brand": "Pokebin",
                "description": "Ultra-rare Pikachu Illustrator card. Extremely limited and valuable collectible.",
                "slug": "pikachu-illustrator-card",
                "price": "599.99",
                "category_slug": "trading-cards",
                "stock": 1,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Blastoise VMAX",
                "brand": "Pokebin",
                "description": "Modern Blastoise VMAX card with stunning artwork. Perfect for competitive play or collection.",
                "slug": "blastoise-vmax",
                "price": "49.99",
                "category_slug": "trading-cards",
                "stock": 12,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Eevee Plush Collection",
                "brand": "Pokebin",
                "description": "Set of 8 Eevee evolution plushies. Includes Eevee, Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, and Glaceon.",
                "slug": "eevee-plush-collection",
                "price": "199.99",
                "category_slug": "plushies",
                "stock": 5,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Pokemon Trainer Hat",
                "brand": "Pokebin",
                "description": "Official Pokemon trainer cap with embroidered logo. Adjustable and comfortable.",
                "slug": "pokemon-trainer-hat",
                "price": "24.99",
                "category_slug": "accessories",
                "stock": 30,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
            {
                "title": "Master Ball Replica",
                "brand": "Pokebin",
                "description": "Detailed Master Ball replica with opening mechanism. Premium collectible item.",
                "slug": "master-ball-replica",
                "price": "79.99",
                "category_slug": "accessories",
                "stock": 20,
                "images": [
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                    "images/RayquazaPonchoPikachu.jpg",
                ],
            },
        ]

        created_count = 0

        for data in products_data:
            category = categories.get(data["category_slug"])
            
            # Get images list, default to single image if not provided
            images = data.get("images", ["images/RayquazaPonchoPikachu.jpg"])

            product, created = Product.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "category": category,
                    "title": data["title"],
                    "brand": data["brand"],
                    "description": data["description"],
                    "price": data["price"],
                    "image": images[0] if len(images) > 0 else "images/RayquazaPonchoPikachu.jpg",
                    "image2": images[1] if len(images) > 1 else None,
                    "image3": images[2] if len(images) > 2 else None,
                    "image4": images[3] if len(images) > 3 else None,
                    "stock": data["stock"],
                },
            )

            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created {created_count} products."))



