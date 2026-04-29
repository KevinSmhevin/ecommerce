# Frontend — Claude Notes

This file augments the project-level `/Users/kevinparas/Documents/Github/ecommerce/.claude/CLAUDE.md`
with frontend-specific guidance. Read the project-level file first.

## Two-layer testing strategy

The frontend has two test runners with strictly non-overlapping concerns. If
you find yourself writing the same assertion twice, you have probably picked
the wrong runner.

| Runner     | Lives in                       | Owns                                                      |
| ---------- | ------------------------------ | --------------------------------------------------------- |
| Vitest     | `src/**/*.test.{ts,tsx}`       | Component rendering, hook behavior, context logic, axios mocks, form validation matrices |
| Playwright | `e2e/tests/*.spec.ts`          | Multi-page user journeys, real cookie + CSRF round-trips, real DRF responses, browser-only gating UX (PayPal stub, localStorage hydration across navigations) |

Vitest's `vite.config.js` `test.exclude` keeps it out of `e2e/`. Playwright's
`testDir` keeps it out of `src/`. **Do not blur the boundary** — a Playwright
test that re-asserts a unit-tested code path is wasted CI time.

### When to add a test where

- New component, hook, or pure function → Vitest unit test next to the source.
- New cross-page flow, new API contract, or behavior that depends on real
  cookies/CSRF → Playwright spec under `e2e/tests/`.
- Form validation rules → Vitest. (We already have full coverage for
  Login/Register; mirror that pattern.)
- "Does the URL change to X after I click Y" → Playwright.

### Running the suites

```bash
# Unit tests (fast, mocked, no backend needed):
npm test            # watch mode
npm run test:run    # one-shot for CI

# E2E tests (requires Django running + seed_e2e ran):
npm run e2e         # see e2e/README.md for prerequisites
npm run e2e:ui      # interactive debugger
```

The Playwright suite has its own README with the exact prerequisite
commands: see `e2e/README.md`.

## Existing E2E coverage (avoid duplicating in unit tests)

- `auth-flow.spec.ts` — login → reload → dashboard → logout, plus the
  inactive-user rejection path. Unit tests should NOT mock the
  reload-after-login round-trip; that lives here.
- `browse-cart-checkout.spec.ts` — anonymous browse → product detail → cart
  → checkout, with a stubbed PayPal SDK to assert the form-gating UX.
- `category-filter.spec.ts` — `<select>` change → `/category/<slug>` route
  with no full reload, plus filtered count.
- `check-order.spec.ts` — creates a real guest order via
  `/payment/api/complete-order` then exercises the order-lookup happy path
  and the wrong-email negative path.
- `checkout-prefill.auth.spec.ts` (authenticated) — saved shipping address
  pre-fills, email field is reactive, PayPal stub enables when all required
  fields are populated.
- `csrf-session.spec.ts` — API-level: confirms `/account/api/login` lands
  a `sessionid` cookie that subsequent requests see, and a missing CSRF
  header is rejected with 403.

## Things to keep in mind when editing

- The PayPal SDK is loaded client-side from `www.paypal.com` in production.
  Any spec that visits `/checkout` MUST call `stubPayPal(page)` before
  navigation, or it will try to fetch the real SDK.
- The cart lives in `localStorage` (`'cart'` key). To pre-populate it for a
  test, use `seedCart()` from `e2e/helpers/cart.ts` — `addInitScript` is the
  only reliable way (it runs before the React `CartProvider` mounts).
- `data-testid` is not the default selector strategy. Prefer `getByRole`,
  `getByLabel`, accessible names. Add `data-testid` only when no semantic
  selector is unique.
- The `seed_e2e` Django command shares constants with
  `e2e/fixtures/test-data.ts`. If you change a username, password, or shipping
  field, change BOTH files.
