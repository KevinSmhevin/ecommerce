---
name: Pokebin Django backend is a manual prerequisite, not a Playwright webServer
description: playwright.config.ts boots Vite but expects Django to already be running on 127.0.0.1:8000; do not add Django to the webServer array
type: project
---

The Playwright config (`frontend/playwright.config.ts`) only declares Vite as a `webServer`. Django is a documented manual prerequisite that the developer starts in a separate terminal: `python manage.py runserver` from `backend/`.

**Why:** Wrapping Django into Playwright's webServer array would require: the Python venv path, the .env file, `migrate`, `seed_products`, `sync_categories`, `seed_e2e`, plus matching the developer's preferred port behavior. All of that is fragile compared to the developer-managed runserver they already keep open. The user explicitly preferred this trade-off when scoping the work.

**How to apply:**
- Don't refactor the config to boot Django automatically without confirming with the user first.
- The `e2e/README.md` documents the prerequisite explicitly — keep that in sync if commands change.
- The seed pipeline before any e2e run is: `seed_products` → `sync_categories` → `seed_e2e`. Order matters: `seed_e2e` needs at least one in-stock product to attach the seeded order.
- The `seed_e2e` management command is idempotent (it `update_or_create`s users and recreates the seeded order on each run).
