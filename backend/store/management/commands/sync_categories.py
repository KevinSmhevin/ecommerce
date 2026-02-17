from django.core.management.base import BaseCommand
from django.db import transaction

from store.models import Category, Product


TARGET_CATEGORIES = [
    {"name": "Graded Pokemon English", "slug": "graded-pokemon-english"},
    {"name": "Graded Pokemon Japanese", "slug": "graded-pokemon-japanese"},
    {"name": "Graded One Piece", "slug": "graded-one-piece"},
    {"name": "Funko Pops", "slug": "funko-pops"},
]

# Default mapping from existing slugs to new slugs.
# You can override or extend this with --map old-slug:new-slug.
DEFAULT_REASSIGNMENTS = {
    "cards": "graded-pokemon-english",
    "trading-cards": "graded-pokemon-japanese",
    "funko-pops": "funko-pops",
}


class Command(BaseCommand):
    help = (
        "Sync category set to graded categories + Funko Pops, "
        "reassign products from old categories, and optionally delete obsolete categories."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without writing to the database.",
        )
        parser.add_argument(
            "--delete-obsolete",
            action="store_true",
            help="Delete categories not in target set (only safe when they have no products).",
        )
        parser.add_argument(
            "--fallback-slug",
            type=str,
            default="",
            help=(
                "If set, products in unmapped obsolete categories are reassigned "
                "to this target slug before deletion checks."
            ),
        )
        parser.add_argument(
            "--map",
            action="append",
            default=[],
            help="Additional reassignment mapping in format old-slug:new-slug. Can be used multiple times.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        delete_obsolete = options["delete_obsolete"]
        fallback_slug = (options["fallback_slug"] or "").strip()

        reassignments = dict(DEFAULT_REASSIGNMENTS)
        for raw in options["map"]:
            if ":" not in raw:
                self.stdout.write(self.style.ERROR(f"Invalid --map value '{raw}'. Use old-slug:new-slug"))
                return
            old_slug, new_slug = [part.strip() for part in raw.split(":", 1)]
            if not old_slug or not new_slug:
                self.stdout.write(self.style.ERROR(f"Invalid --map value '{raw}'. Use old-slug:new-slug"))
                return
            reassignments[old_slug] = new_slug

        target_slugs = {item["slug"] for item in TARGET_CATEGORIES}
        if fallback_slug and fallback_slug not in target_slugs:
            self.stdout.write(
                self.style.ERROR(
                    f"--fallback-slug '{fallback_slug}' must be one of: {', '.join(sorted(target_slugs))}"
                )
            )
            return

        self.stdout.write(self.style.WARNING("Syncing categories..."))
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN enabled. No database changes will be written."))

        created = 0
        renamed = 0
        reassigned_products = 0
        deleted = 0
        skipped_with_products = 0

        with transaction.atomic():
            # 1) Ensure target categories exist with expected names.
            target_by_slug = {}
            for item in TARGET_CATEGORIES:
                slug = item["slug"]
                name = item["name"]
                category, was_created = Category.objects.get_or_create(slug=slug, defaults={"name": name})
                target_by_slug[slug] = category
                if was_created:
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f"+ Created category: {name} ({slug})"))
                elif category.name != name:
                    if not dry_run:
                        category.name = name
                        category.save(update_fields=["name"])
                    renamed += 1
                    self.stdout.write(self.style.SUCCESS(f"~ Renamed category slug '{slug}' to '{name}'"))

            # 2) Reassign explicitly mapped old categories.
            for old_slug, new_slug in reassignments.items():
                old_category = Category.objects.filter(slug=old_slug).first()
                new_category = target_by_slug.get(new_slug)
                if not old_category:
                    continue
                if not new_category:
                    self.stdout.write(
                        self.style.WARNING(
                            f"! Mapping skipped: target slug '{new_slug}' not found for old slug '{old_slug}'"
                        )
                    )
                    continue
                if old_category.id == new_category.id:
                    continue

                count = Product.objects.filter(category=old_category).count()
                if count > 0:
                    if not dry_run:
                        Product.objects.filter(category=old_category).update(category=new_category)
                    reassigned_products += count
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"> Reassigned {count} products from '{old_slug}' -> '{new_slug}'"
                        )
                    )

            # 3) Handle obsolete categories.
            obsolete_categories = Category.objects.exclude(slug__in=target_slugs).order_by("slug")
            for obsolete in obsolete_categories:
                product_count = Product.objects.filter(category=obsolete).count()

                if product_count > 0 and fallback_slug:
                    fallback_category = target_by_slug[fallback_slug]
                    if obsolete.id != fallback_category.id:
                        if not dry_run:
                            Product.objects.filter(category=obsolete).update(category=fallback_category)
                        reassigned_products += product_count
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"> Reassigned {product_count} products from '{obsolete.slug}' -> '{fallback_slug}' (fallback)"
                            )
                        )
                        product_count = 0

                if delete_obsolete:
                    if product_count == 0:
                        if not dry_run:
                            obsolete.delete()
                        deleted += 1
                        self.stdout.write(self.style.SUCCESS(f"- Deleted obsolete category: {obsolete.slug}"))
                    else:
                        skipped_with_products += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"! Skipped deleting '{obsolete.slug}' ({product_count} products still assigned)."
                            )
                        )
                else:
                    if product_count > 0:
                        skipped_with_products += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"! Obsolete category '{obsolete.slug}' still has {product_count} products. "
                                "Use --fallback-slug and/or --delete-obsolete."
                            )
                        )

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS("\nCategory sync complete."))
        self.stdout.write(self.style.SUCCESS(f"Created categories: {created}"))
        self.stdout.write(self.style.SUCCESS(f"Renamed categories: {renamed}"))
        self.stdout.write(self.style.SUCCESS(f"Reassigned products: {reassigned_products}"))
        self.stdout.write(self.style.SUCCESS(f"Deleted obsolete categories: {deleted}"))
        if skipped_with_products:
            self.stdout.write(self.style.WARNING(f"Skipped categories with products: {skipped_with_products}"))

        self.stdout.write(
            self.style.WARNING(
                "\nSuggested run order:\n"
                "1) python manage.py sync_categories --dry-run\n"
                "2) python manage.py sync_categories --delete-obsolete --fallback-slug graded-pokemon-english\n"
                "   (or choose a different fallback slug)"
            )
        )
