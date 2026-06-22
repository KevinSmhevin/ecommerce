import { test, expect } from '@playwright/test'

import { E2E_SHIPPING } from '../fixtures/test-data'
import { stubPayPal } from '../helpers/paypal'

/**
 * Why this is e2e:
 *  - The pre-fill effect in Checkout.tsx merges three async sources: the
 *    auth query (`useAuthQuery`), the saved shipping query
 *    (`useShippingQuery`), and the cart's contents. Verifying the merge
 *    requires a real /account/api/manage-shipping response and a real cart.
 *  - This is the `chromium-authenticated` project — it inherits the saved
 *    storageState (sessionid + csrftoken cookies) from `auth.setup.ts`.
 *
 * We intentionally walk the real browse → add-to-cart path instead of
 * seeding localStorage directly, because CartProvider's mount-effects
 * race on hydration when localStorage is pre-populated outside the React
 * lifecycle.
 */

test.beforeEach(async ({ page }) => {
  await stubPayPal(page)
})

test('checkout pre-fills the saved shipping address and email is reactive', async ({ page }) => {
  // 1) Add a product to the cart through the UI so CartContext is hydrated
  //    via its own state setters (not via a localStorage pre-seed, which
  //    races with CartProvider's mount-effect that writes [] back).
  await page.goto('/')
  // Pick the first catalog card from a category section (not the rotating
  // "featured" card in the hero).
  const firstProduct = page.locator('section[id^="category-"] a[href^="/product/"]').first()
  await expect(firstProduct).toBeVisible()
  await firstProduct.click()

  await page.getByRole('button', { name: /add to cart/i }).click()

  // 2) Navigate to /checkout via the cart, the same way real users do.
  await page.getByRole('link', { name: /^cart\b/i }).first().click()
  await expect(page).toHaveURL('/cart')

  await page.getByRole('link', { name: 'Checkout' }).click()
  await expect(page).toHaveURL('/checkout')

  // The saved address from seed_e2e.py should populate immediately.
  await expect(page.getByLabel('Full Name *')).toHaveValue(E2E_SHIPPING.full_name)
  await expect(page.getByLabel('Email *')).toHaveValue(E2E_SHIPPING.email)
  await expect(page.getByLabel('Address Line 1 *')).toHaveValue(E2E_SHIPPING.address1)
  await expect(page.getByLabel('Address Line 2 (Optional)')).toHaveValue(E2E_SHIPPING.address2)
  await expect(page.getByLabel('City *')).toHaveValue(E2E_SHIPPING.city)

  // Because all four required fields are pre-populated, the PayPal stub
  // should already be enabled (no extra typing needed).
  const payPalContainer = page.locator('[data-paypal-stub="true"]')
  await expect(payPalContainer).toBeVisible()
  await expect(payPalContainer).toHaveAttribute('data-paypal-state', 'enabled')

  // Email field is reactive: typing into it should clear any backend-error
  // styling and persist locally without a refetch. We can only assert the
  // controlled-input round-trip here; backend persistence belongs to
  // `/manage-shipping`, not `/checkout`.
  const emailField = page.getByLabel('Email *')
  await emailField.fill('different@example.com')
  await expect(emailField).toHaveValue('different@example.com')
})
