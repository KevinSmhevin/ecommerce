# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Summary

Pokebin is a production e-commerce platform for selling Trading Card Game (TCG) cards, focused primarily on Pokémon cards. It is a two-tier app: a Django REST API backend and a React (Vite) single-page frontend. Production runs on Render, with a Cloudflare R2 bucket for product media and SendGrid for transactional email.

Production domains: `pokebin.app`, `www.pokebin.app`, `pokebin.onrender.com`.

## Repository Layout

```
ecommerce/
├── backend/              # Django 5.1 REST API
│   ├── ecommerce/        # Project package (settings, urls, wsgi)
│   ├── store/            # Catalog: Category, Product, list/detail API
│   ├── cart/             # Session-based cart (legacy template flows)
│   ├── account/          # Auth, registration, email verification, profile, shipping
│   ├── payment/          # Order, OrderItem, ShippingAddress, checkout/complete-order
│   ├── static/           # Static assets (collected to staticfiles/ in prod)
│   ├── manage.py
│   ├── Procfile          # Render web process: gunicorn ecommerce.wsgi
│   └── requirements.txt
├── frontend/             # React 18 + Vite SPA
│   ├── src/
│   │   ├── pages/        # Route-level components (Home, Checkout, Dashboard, ...)
│   │   ├── components/   # Navbar, Banner, Logo, Pagination, InstagramLink
│   │   ├── context/      # AppContext, AuthContext, CartContext
│   │   ├── config/axios.js   # Axios baseURL + CSRF interceptor
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js    # Dev proxy: /api, /account, /payment → 127.0.0.1:8000
│   └── package.json
├── render.yaml           # Render Blueprint (api + static frontend services)
└── README.md
```

## Tech Stack

### Backend
- Python 3.12, Django 5.1.3, Django REST Framework 3.14
- PostgreSQL in production (psycopg2-binary), SQLite for local dev
- `django-cors-headers`, `django-environ`, `django-storages` (R2/S3), `whitenoise` (static)
- Gunicorn for production WSGI
- Pillow for image handling
- Crispy Forms (bootstrap4 pack) for legacy template forms

### Frontend
- React 18 + React Router 6
- Vite 5 build tool / dev server
- Tailwind CSS 3, PostCSS, Autoprefixer
- Axios (with `withCredentials: true` and CSRF interceptor)
- React Icons
- PayPal JS SDK (loaded client-side via `VITE_PAYPAL_CLIENT_ID`)

### Infrastructure / Services
- Hosting: Render (backend web service + static frontend)
- Object storage: Cloudflare R2 (preferred, via `USE_R2=True`); falls back to AWS S3 if `AWS_STORAGE_BUCKET_NAME` is set; otherwise local filesystem
- Email: SendGrid SMTP (`smtp.sendgrid.net:587`, TLS) — `from` is `noreply@pokebin.app`
- Payments: PayPal (client-side checkout, server-side order creation)

## Django Apps

| App | Purpose |
|-----|---------|
| `store` | Catalog. `Category` (name, slug) and `Product` (title, brand, description, slug, price, 4× image fields, stock, units_sold). Read-only DRF viewsets at `/api/categories/` and `/api/products/`. Search by title/description/brand; ordering by price/title; `?category=<slug>` filter. Lookup by `slug`. |
| `cart` | Session-backed cart used by legacy Django template flows. The React SPA manages cart state via `CartContext` instead. |
| `account` | Custom registration with email verification token, login/logout, password reset (`auth_views`), dashboard, profile and shipping management. Both legacy template views and DRF endpoints under `/account/api/`. |
| `payment` | `Order`, `OrderItem`, `ShippingAddress` models. `pre_save` signal stamps `date_shipped` when `shipped` flips to True. `POST /payment/api/complete-order` creates the order, decrements stock, increments `units_sold`, and emails the buyer. |

## Routing

Backend mounts (see `backend/ecommerce/urls.py`):
- `admin/` — Django admin
- `api/categories/`, `api/products/` — DRF router (read-only)
- `cart/`, `account/`, `payment/` — app URL includes
- Legacy `store.urls` mounted at root for template pages
- Media files served via `static()` helper in dev

Frontend routes (see `frontend/src/App.jsx`): `/`, `/product/:slug`, `/category/:slug`, `/cart`, `/login`, `/register`, `/check-order`, `/dashboard`, `/track-orders`, `/profile-management`, `/manage-shipping`, `/checkout`, `/payment-success`, `/payment-failed`.

## Auth Model

- DRF `DEFAULT_AUTHENTICATION_CLASSES = [SessionAuthentication]`, `DEFAULT_PERMISSION_CLASSES = [AllowAny]`
- The frontend calls `GET /account/api/csrf-token` once and the axios interceptor attaches `X-CSRFToken` to all unsafe methods. All requests go out with `withCredentials: true` so the Django session cookie rides along.
- Cross-site cookies in production: `SESSION_COOKIE_SAMESITE = 'None'` + `SESSION_COOKIE_SECURE = True` (and same for CSRF) — required because the frontend and API are on separate Render hostnames.
- New accounts are created with `is_active=False` until the email-verification link is followed.

## Common Commands

### Backend (run from `backend/`)
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_products      # seeds sample products
python manage.py sync_categories    # syncs category data
python manage.py runserver          # http://127.0.0.1:8000
python manage.py collectstatic --noinput   # used by Render build
```

### Frontend (run from `frontend/`)
```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api, /account, /payment to :8000)
npm run build      # outputs to dist/
npm run preview
npm test           # run tests in watch mode (Vitest)
npm run test:run   # run tests once (CI / one-shot)
```

## Environment Variables

Backend (`backend/.env` locally; set on Render in prod):
- `SECRET_KEY` (required)
- `DEBUG` — `True` locally, `False` in prod
- `FRONTEND_URL` — used for CORS + CSRF trusted origins
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` — when set, switches to PostgreSQL; otherwise SQLite
- `USE_R2` (`True`/`False`) plus `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, optional `R2_CUSTOM_DOMAIN`
- `AWS_STORAGE_BUCKET_NAME` — fallback S3 bucket if R2 disabled
- `SENDGRID_API_KEY`, `DEFAULT_FROM_EMAIL`

Frontend (Vite, prefixed `VITE_`):
- `VITE_API_URL` — backend base URL in prod (e.g. `https://pokebin-api.onrender.com`)
- `VITE_PAYPAL_CLIENT_ID`

Local dev tip: leave `VITE_API_URL` unset so axios uses relative URLs and the Vite proxy forwards to `127.0.0.1:8000`.

## Storage Configuration Logic (`ecommerce/settings.py`)

1. If `USE_R2=True` → django-storages S3 backend pointed at the Cloudflare R2 endpoint. `MEDIA_URL` becomes `https://<R2_CUSTOM_DOMAIN or {bucket}.r2.dev>/`.
2. Else if `AWS_STORAGE_BUCKET_NAME` set → standard AWS S3.
3. Else → local filesystem (`MEDIA_ROOT = backend/static/media`).

Static files are always served by WhiteNoise's `CompressedManifestStaticFilesStorage`.

## Conventions and Gotchas

- `Product` exposes 4 image fields (`image`, `image2`, `image3`, `image4`); the serializer emits `image_url`/`image2_url`/... resolved against the request or the configured S3/R2 host.
- `ProductViewSet` only returns products with `stock__gt=0`. To surface out-of-stock items you must change the queryset.
- `cart` app is session-based and tied to the legacy Django templates — the React SPA does not use it; cart state lives in `CartContext`. Don't add new SPA cart logic to `cart/` unless you intentionally bridge the two.
- Legacy template views still exist alongside the API endpoints (`account/views.py`, `payment/views.py`). Treat the `api_views.py` modules as the source of truth for the React app.
- `complete_order` swallows email send errors — orders are created even if the confirmation email fails. Don't add hard failures there without thought.
- DRF default permission is `AllowAny`; sensitive endpoints opt in via `@permission_classes([IsAuthenticated])`. Keep that pattern when adding endpoints.
- `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` are explicit allow-lists. New frontend hosts must be added to both.
- `db.sqlite3` is committed in the working tree historically but is gitignored going forward — don't rely on it for prod data.

## Frontend Testing

### Stack
- **Runner**: Vitest 1.x (configured in `vite.config.js` under the `test` key)
- **Environment**: jsdom
- **Libraries**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- **Setup file**: `frontend/src/test/setup.js` (imports jest-dom matchers)

### Test file locations
Tests live alongside source files or in the same directory, named `*.test.jsx` / `*.test.js`:

| File | What is covered |
|---|---|
| `src/lib/utils.test.js` | `cn()` class merging utility |
| `src/config/axios.test.js` | CSRF interceptor — X-CSRFToken on POST/PUT/PATCH/DELETE, not GET |
| `src/context/CartContext.test.jsx` | init, add/remove/update, stock caps, localStorage, totals |
| `src/context/AuthContext.test.jsx` | checkAuth, login/logout, register, error handling |
| `src/context/AppContext.test.jsx` | fetchProducts, fetchCategories, slug lookups, error states |
| `src/components/Alert.test.jsx` | variants, children rendering |
| `src/components/Pagination.test.jsx` | boundaries, ellipsis, aria-current, click handlers |
| `src/components/ProductCard.test.jsx` | rendering, image fallback, slug link |
| `src/components/NavbarStadium.test.jsx` | auth/unauth states, cart badge, logout |
| `src/pages/Login.test.jsx` | form, validation, API call, loading, error display |
| `src/pages/Register.test.jsx` | form, field errors, success screen, 3s redirect |

### Conventions
- Mock axios with `vi.mock('../config/axios')` — the mock must stub `defaults` and `interceptors.request.use` since `axios.js` runs interceptor registration at module load time.
- Wrap components in their required context providers inside tests; don't import context internals directly.
- Use `fireEvent.change` over `userEvent.type` for multi-field forms to avoid per-character async overhead hitting the 5s timeout.
- For fake-timer + async tests (e.g. the Register 3s redirect): flush microtasks with `await act(async () => { await Promise.resolve() })` before advancing timers — `waitFor` breaks under `vi.useFakeTimers`.
- Page tests mock `useAuth` as `vi.fn()` so each `beforeEach` can set the return value without module re-imports.

## Deployment

`render.yaml` declares two services:
- `pokebin-api` (Python web service) — build runs `pip install` + `collectstatic`, start runs `gunicorn ecommerce.wsgi:application`.
- `pokebin-frontend` (static site) — build runs `npm install && npm run build`, serves `frontend/dist`.

All secrets are `sync: false` in the blueprint and must be set in the Render dashboard.
