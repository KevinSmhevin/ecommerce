---
name: Pokebin CartContext localStorage hydration race
description: Pre-seeding the `cart` key in localStorage from a Playwright initScript is overwritten by CartProvider's mount-effect that writes [] back before the read effect's setState propagates
type: project
---

`CartProvider` (frontend/src/context/CartContext.tsx) has two mount-effects: one reads `localStorage.getItem('cart')` and calls `setCartItems(parsed)`, the other writes `JSON.stringify(cartItems)` whenever `cartItems` changes. On first render `cartItems` is `[]`, so the writer fires immediately and overwrites whatever was in localStorage before the reader's state update propagates.

**Why:** This bites Playwright tests that try `seedCart()` via `page.addInitScript(() => localStorage.setItem('cart', ...))` to skip the browse-add-to-cart step. The test lands on a fresh route, the provider mounts, the writer wipes the seed, and Checkout's "empty cart → /cart" guard bounces the test off the page.

**How to apply:**
- For any e2e test that needs items in the cart, drive the real UI (browse → product detail → Add to Cart) instead of seeding localStorage. The `checkout-prefill.auth.spec.ts` test does this.
- Keep `e2e/helpers/cart.ts` around for documentation but don't rely on it.
- If you ever need a faster cart seed, fix the underlying race first (e.g., make the writer skip the very first render, or merge both effects into one with a hydration guard).
