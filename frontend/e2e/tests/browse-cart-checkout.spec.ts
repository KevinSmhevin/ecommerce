import { test, expect } from '@playwright/test'

import { stubPayPal } from '../helpers/paypal'

/**
 * Why this is e2e (not a unit test):
 *  - Spans 4 React routes (/, /product/:slug, /cart, /checkout).
 *  - Exercises the real /api/products/ list, the real /api/products/<slug>/
 *    detail endpoint, and CartContext's localStorage round-trip across
 *    navigations.
 *  - The "fill required fields → PayPal button enables" gate lives in
 *    Checkout.tsx's effect that wires DOM `input` listeners to PayPal's
 *    `actions.enable/disable`. It cannot be tested in jsdom because PayPal's
 *    stub depends on the real SDK lifecycle. We replace that lifecycle with a
 *    minimal stub (`stubPayPal`) and assert via `data-paypal-state` instead of
 *    poking React state.
 *
 * Coverage NOT duplicated: CartContext add/remove/update logic is unit-tested.
 * This spec only asserts the navigations and the gating end-state.
 */

test.beforeEach(async ({ page }) => {
  await stubPayPal(page)
})

test('anonymous user can browse, add to cart, and reach a gated checkout', async ({ page }) => {
  // 1) Land on home and pick the first product card from a category carousel.
  await page.goto('/')

  // Each category section starts as a full-width banner covering its product
  // carousel; clicking the banner slides it out to reveal the cards in the
  // same row.
  await page.getByRole('button', { name: /show .* products/i }).first().click()

  const firstProductLink = page.locator('a[href^="/product/"]').first()
  await expect(firstProductLink).toBeVisible()
  const productTitle = (await firstProductLink.locator('h3').textContent())?.trim()
  expect(productTitle).toBeTruthy()

  await firstProductLink.click()
  await expect(page).toHaveURL(/\/product\/[\w-]+$/)

  // 2) Add to cart — button text flips to "Added to Cart" briefly.
  const addToCart = page.getByRole('button', { name: /add to cart/i })
  await expect(addToCart).toBeEnabled()
  await addToCart.click()
  await expect(page.getByRole('button', { name: /added to cart/i })).toBeVisible()

  // 3) Navigate to the cart via the navbar.
  await page.getByRole('link', { name: /^cart\b/i }).first().click()
  await expect(page).toHaveURL('/cart')
  await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible()

  // The cart should show one item with the title from the product detail page.
  if (productTitle) {
    await expect(page.getByRole('link', { name: new RegExp(productTitle, 'i') })).toBeVisible()
  }

  // Bump quantity from 1 to 2 (CartContext clamps at product.stock; seed
  // products all have stock >= 1, most >= 3).
  const plus = page.getByRole('button', { name: '+' }).first()
  await plus.click()
  // The quantity display sits between the +/- buttons.
  await expect(page.locator('span', { hasText: '2' }).first()).toBeVisible()

  // 4) Proceed to checkout.
  await page.getByRole('link', { name: 'Checkout' }).click()
  await expect(page).toHaveURL('/checkout')

  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

  // 5) Gating: PayPal stub container should render disabled, and the
  //    "fill in required fields" hint should be visible.
  const payPalContainer = page.locator('[data-paypal-stub="true"]')
  await expect(payPalContainer).toBeVisible()
  await expect(payPalContainer).toHaveAttribute('data-paypal-state', 'disabled')
  await expect(page.getByText(/fill in required fields/i)).toBeVisible()

  // 6) Fill the four required fields. The Checkout effect listens to
  //    `input`/`change` and flips PayPal's actions.enable() — our stub mirrors
  //    that to data-paypal-state="enabled".
  await page.getByLabel('Full Name *').fill('Ash Ketchum')
  await page.getByLabel('Email *').fill('ash@example.com')
  await page.getByLabel('Address Line 1 *').fill('1 Pallet Town Rd')
  await page.getByLabel('City *').fill('Pallet Town')

  await expect(payPalContainer).toHaveAttribute('data-paypal-state', 'enabled')
  await expect(page.getByText(/fill in required fields/i)).toBeHidden()

  // We deliberately stop here: clicking the stub button would trigger the
  // mocked PayPal capture path, which is an integration shape we don't want
  // to test (and which would mutate Product stock in the real DB).
})
