# eBay → Pokebin Sync

One-way sync that mirrors the seller's **eBay** inventory into the Pokebin
catalog as `store.Product` rows. eBay is the source of truth; Pokebin
reflects it. There is **no separate worker** — the sync runs in-process,
triggered from the Django admin **"Sync now"** button (with a CLI command
as a fallback for large bulk imports).

## How it works

```
eBay Sell Inventory API ──► EbayClient ──► SyncService ──► store.Product
   (inventory_item,          (OAuth +      (filter by      (+ EbayListing
    offer)                    REST reads)   category,        audit row)
                                            upsert)
```

- `services/client.py` — `EbayClient`: OAuth (auth-code grant + auto-refresh)
  and the Sell Inventory reads (`iter_inventory_items`, `get_offers_for_sku`).
- `services/sync.py` — `SyncService.sync_all()`: walks inventory, keeps only
  items whose eBay **store category** is mapped (see below), and upserts a
  `Product` keyed by SKU (`Product.ebay_listing_id`). Each SKU also gets an
  `EbayListing` audit row (`synced` / `skipped` / `error`).
- `admin.py` — the "Sync now" button (under **Ebay → eBay listings**).
- `management/commands/` — `ebay_oauth` (token bootstrap) and `sync_ebay`
  (CLI sync).

Only **published** offers are mirrored. A SKU with no published offer, or an
unmapped store category, is recorded as `skipped`.

## Environment variables

Set in `backend/.env` locally, or the Render dashboard in production. The
keyset must match `EBAY_ENV` — sandbox keys only work with `sandbox`,
production keys with `production`.

| Var | Required | Notes |
|-----|----------|-------|
| `EBAY_ENV` | yes | `sandbox` or `production` |
| `EBAY_APP_ID` | yes | App ID (Client ID) |
| `EBAY_CERT_ID` | yes | Cert ID (Client Secret) |
| `EBAY_DEV_ID` | yes | Dev ID |
| `EBAY_RU_NAME` | yes | RuName (OAuth redirect identifier); env-specific |
| `EBAY_STORE_CATEGORY_IDS` | no | Comma-separated allowlist; backstop when no mappings exist yet |

Get the keys and RuName from the [eBay developer console](https://developer.ebay.com/).
The refresh token is **not** an env var — it lives in the database
(`EbayAuthToken`), minted by `ebay_oauth` (below).

## Setup

### 1. One-time OAuth bootstrap

Mints and stores the seller's refresh token. Sign in with the **account that
owns the listings** — a sandbox test user for `sandbox`, your real seller
account for `production`.

```bash
cd backend
source ../venv/bin/activate
python manage.py ebay_oauth
```

Open the printed consent URL, approve, then paste back **either** the whole
redirect URL **or** the `code` value — URL-encoding is handled for you. The
code expires ~5 minutes after consent, so don't dawdle.

### 2. Map eBay store categories → Pokebin categories

Admin → **Ebay → eBay category mappings** → add a row per eBay store category
you want mirrored, pointing at a Pokebin `Category`, `active=True`. Only
mapped (or allowlisted) categories sync.

### 3. Sync

- **Admin button:** Ebay → eBay listings → **Sync now**.
- **CLI (bulk / initial import):** `python manage.py sync_ebay`
  (`--dry-run` to preview counts without writing).

## Production notes

- eBay vars live on the `pokebin-api` web service in `render.yaml`
  (`EBAY_*`). `EBAY_ENV` is pinned to `production`; the rest are `sync: false`
  — set their values in the Render dashboard.
- The sync runs inside the web request, so gunicorn is started with
  `--timeout 120` (it downloads images). For a very large first import, prefer
  the `sync_ebay` CLI from a Render shell (no request timeout). The sync is
  idempotent, so a timed-out button click is safe to retry.
- Sandbox and production are fully independent: separate keys, separate
  RuName, separate refresh token. Re-run `ebay_oauth` after switching envs.

## Tests

```bash
python manage.py test ebay
```

Covers the sync engine (`test_sync.py`), the admin "Sync now" view
(`test_admin.py`), and auth-code normalisation (`test_oauth_command.py`).
`SyncService` is decoupled from HTTP, so the suite runs offline against a
fake client.
