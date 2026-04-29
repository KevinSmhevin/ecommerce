import type { Page } from '@playwright/test'

/**
 * Seed the cart's localStorage entry so a test can land on /cart or /checkout
 * without having to traverse the full browse flow. The shape here matches
 * `CartItem` in `frontend/src/types/cart.ts` (a Product with a `quantity`).
 *
 * Use sparingly — at least one spec should still exercise the
 * browse → click → add-to-cart path end-to-end.
 */
export interface SeededCartItem {
  id: number
  slug: string
  title: string
  price: string
  stock: number
  quantity: number
  image_url?: string | null
}

export async function seedCart(page: Page, items: SeededCartItem[]): Promise<void> {
  await page.addInitScript((seed) => {
    window.localStorage.setItem('cart', JSON.stringify(seed))
  }, items)
}
