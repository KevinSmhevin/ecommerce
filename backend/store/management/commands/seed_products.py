from django.core.management.base import BaseCommand
from django.core.files import File
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings
import os

from store.models import Category, Product


class Command(BaseCommand):
    help = "Seed the database with sample categories and products for local development."
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing products before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Seeding sample categories and products..."))
        
        # Clear existing products if --clear flag is set
        if options['clear']:
            self.stdout.write(self.style.WARNING("Clearing existing products..."))
            Product.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Cleared existing products."))

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
        error_count = 0

        for data in products_data:
            try:
                category = categories.get(data["category_slug"])
                
                if not category:
                    self.stdout.write(
                        self.style.ERROR(f"Category '{data['category_slug']}' not found for product '{data['title']}'")
                    )
                    error_count += 1
                    continue
                
                # Get images list, default to single image if not provided
                images = data.get("images", ["images/RayquazaPonchoPikachu.jpg"])
                
                # Helper function to get image file object
                def get_image_file(image_path):
                    """Get a File object for the image path, or None if file doesn't exist."""
                    # Image paths in seed data are like "images/RayquazaPonchoPikachu.jpg"
                    # MEDIA_ROOT is BASE_DIR / 'static/media'
                    # So full path should be: static/media/images/RayquazaPonchoPikachu.jpg
                    
                    full_path = None
                    file_name = None
                    
                    # Try the path as-is (relative to MEDIA_ROOT)
                    test_path = settings.MEDIA_ROOT / image_path
                    if os.path.exists(test_path):
                        full_path = test_path
                        file_name = image_path
                    else:
                        # Try alternative: if image_path is just a filename, add images/ prefix
                        if not '/' in image_path:
                            alt_path = settings.MEDIA_ROOT / "images" / image_path
                            if os.path.exists(alt_path):
                                full_path = alt_path
                                file_name = f"images/{image_path}"
                        else:
                            # Try with just the filename
                            filename = os.path.basename(image_path)
                            alt_path2 = settings.MEDIA_ROOT / "images" / filename
                            if os.path.exists(alt_path2):
                                full_path = alt_path2
                                file_name = f"images/{filename}"
                    
                    if full_path and file_name:
                        # Read file content into memory to avoid "seek of closed file" error
                        with open(full_path, 'rb') as f:
                            file_content = f.read()
                        # Create ContentFile from the content (keeps it in memory)
                        return ContentFile(file_content, name=file_name)
                    
                    return None
                
                # Get image files
                image_file = get_image_file(images[0] if len(images) > 0 else "images/RayquazaPonchoPikachu.jpg")
                image2_file = get_image_file(images[1]) if len(images) > 1 else None
                image3_file = get_image_file(images[2]) if len(images) > 2 else None
                image4_file = get_image_file(images[3]) if len(images) > 3 else None
                
                if not image_file:
                    self.stdout.write(
                        self.style.ERROR(f"Image file not found for product '{data['title']}'")
                    )
                    error_count += 1
                    continue
                
                product, created = Product.objects.get_or_create(
                    slug=data["slug"],
                    defaults={
                        "category": category,
                        "title": data["title"],
                        "brand": data["brand"],
                        "description": data["description"],
                        "price": data["price"],
                        "image": image_file,
                        "image2": image2_file,
                        "image3": image3_file,
                        "image4": image4_file,
                        "stock": data["stock"],
                    },
                )

                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ Created: {data['title']}")
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"⊘ Already exists: {data['title']}")
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ Error creating {data.get('title', 'unknown')}: {str(e)}")
                )
                error_count += 1

        self.stdout.write(self.style.SUCCESS(f"\nSeed complete!"))
        self.stdout.write(self.style.SUCCESS(f"Created: {created_count} products"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"Errors: {error_count} products"))
        
        # Show total count
        total_products = Product.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Total products in database: {total_products}"))



