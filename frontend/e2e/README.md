# Pokebin Playwright E2E Suite

End-to-end tests for the Pokebin React + Django stack. These run a real Vite
dev server and hit a real Django backend; **they are not a substitute for
the Vitest unit suite under `src/**/*.test.{ts,tsx}`** — the two layers are
intentionally non-overlapping.

| Layer    | Owns                                                                 |
| -------- | -------------------------------------------------------------------- |
| Vitest   | Component rendering, hooks, context logic, form validation, axios mocks |
| Playwright | Multi-page flows, real cookies/CSRF, real DRF round-trips, gating UX |

## Prerequisites

You must have **the Django backend running on `127.0.0.1:8000` and the
`seed_e2e` data loaded** before running the suite. Playwright will boot the
Vite dev server itself, but it deliberately does **not** start Django (running
Python + venv + migrations from `playwright.config.ts` is fragile; documenting
it as a manual step is more reliable).

### One-time setup

```bash
# 1) Frontend — install Playwright browsers (chromium only, ~150MB).
cd frontend
npm install
npm run e2e:install

# 2) Backend — install Python deps + run migrations once.
cd ../backend
pip install -r requirements.txt
python manage.py migrate
```

### Before each test run

```bash
# In one terminal: start Django (NOT Vite — Playwright boots Vite itself).
cd backend
python manage.py runserver

# In another terminal: seed the catalogue and the e2e users/order, then run.
cd backend
python manage.py seed_products      # idempotent
python manage.py sync_categories    # idempotent
python manage.py seed_e2e           # idempotent — resets passwords + shipping

cd ../frontend
npm run e2e
```

## Commands

| Command              | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run e2e`        | Run the full suite headlessly (chromium only).          |
| `npm run e2e:ui`     | Open Playwright's interactive UI mode (good for debug). |
| `npm run e2e:install`| One-time browser download.                              |

To target a single spec:

```bash
npm run e2e -- e2e/tests/auth-flow.spec.ts
```

## Layout

```
e2e/
├── .auth/                  # generated storageState (gitignored)
├── fixtures/
│   └── test-data.ts        # constants shared with backend/seed_e2e.py
├── helpers/
│   ├── cart.ts             # seedCart() — populate localStorage pre-navigation
│   └── paypal.ts           # stubPayPal() — replace the SDK with a recordable stub
├── tests/
│   ├── auth.setup.ts       # setup project: logs in once, saves storageState
│   ├── auth-flow.spec.ts   # login → reload → dashboard → logout (+ inactive user)
│   ├── browse-cart-checkout.spec.ts  # browse → cart → checkout gating
│   ├── category-filter.spec.ts       # category dropdown → URL + filtered grid
│   ├── check-order.spec.ts           # guest order lookup, happy + wrong-email path
│   ├── checkout-prefill.auth.spec.ts # authenticated checkout pre-fill
│   └── csrf-session.spec.ts          # API-level CSRF + sessionid cookie sanity
└── README.md
```

Specs ending in `.auth.spec.ts` run in the `chromium-authenticated` Playwright
project, which depends on the `setup` project (`auth.setup.ts`) and consumes
`e2e/.auth/user.json`. All other specs run unauthenticated.

## What the seed creates

`seed_e2e.py` creates (and re-resets each run):

- `e2e_user` / `P0kebin!E2E_test` — `is_active=True`, with a saved
  `ShippingAddress` matching the constants in `fixtures/test-data.ts`.
- `e2e_inactive` / `P0kebin!E2E_test` — `is_active=False`, used to assert
  the "account is not active" rejection path.
- One guest `Order` for `guest_order@pokebin.test` (legacy seed; the
  `check-order.spec.ts` itself creates a fresh order via the public
  `/payment/api/complete-order` endpoint to avoid relying on a known order id).

## Resetting state

The seed command is idempotent — re-running it overwrites the seeded user's
password and shipping address. Real orders accumulate in the DB; if your
SQLite file gets noisy, `rm backend/db.sqlite3 && python manage.py migrate &&
python manage.py seed_products && python manage.py sync_categories &&
python manage.py seed_e2e` will give you a clean slate.

## Things you might trip over

- **Vite proxies `/api`, `/account`, `/payment` to `127.0.0.1:8000`.** If
  Django isn't running on that port, every test fails fast with a 502.
- **`SESSION_COOKIE_SAMESITE='None'` only fires under `DEBUG=False`.** Locally
  with `DEBUG=True` the session cookie defaults to `Lax`, which is fine for
  `localhost:5173` ↔ `127.0.0.1:8000` because they share an eTLD+1.
- **`stubPayPal()` is mandatory for any spec that loads `/checkout`.**
  Without it the page tries to fetch the real PayPal SDK from
  `www.paypal.com`, which is slow, flaky, and does not work offline.
- **`api_complete_order` mutates real Product stock.** The check-order spec
  creates a real order and decrements one unit of the first in-stock seeded
  product. Re-run `seed_products --clear` periodically if stock counts drift.

## What this suite does NOT cover (intentionally)

- Anything covered by Vitest (`src/**/*.test.{ts,tsx}`).
- The PayPal capture flow itself (third-party iframe — out of scope).
- Email delivery — registration calls SendGrid synchronously with
  `fail_silently=False`. A "register via UI" e2e test would need a test-only
  email backend swap (`EMAIL_BACKEND=django.core.mail.backends.locmem`),
  which would be a deliberate test-only patch to backend settings. Add it
  if/when registration becomes a critical e2e path.
