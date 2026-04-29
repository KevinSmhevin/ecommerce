import { test, expect, request } from '@playwright/test'

import { BACKEND_URL } from '../fixtures/test-data'

/**
 * Why this is e2e:
 *  - Drives the full guest check-order flow against the real backend:
 *    the test seeds an order via /payment/api/complete-order (which is
 *    `AllowAny`), then looks it up via /account/api/check-order.
 *  - As a side effect this spec also proves the (id + email) two-factor
 *    guest lookup actually rejects a wrong email — a server-side check
 *    that no unit test exercises.
 *
 * NOT duplicated from unit tests: there is no unit test for CheckOrder.
 */

const SEED_EMAIL = `pw_${Date.now()}@pokebin.test`
let seededOrderId: number | string

test.beforeAll(async () => {
  const ctx = await request.newContext({ baseURL: BACKEND_URL })

  // Discover any in-stock product so we can place a real order.
  const productsResp = await ctx.get('/api/products/?page=1')
  expect(productsResp.ok()).toBeTruthy()
  const productsBody = (await productsResp.json()) as {
    results: Array<{ id: number; price: string; stock: number; title: string }>
  }
  const product = productsBody.results.find((p) => p.stock > 0)
  if (!product) throw new Error('seed_products must be run before this spec')

  // CSRF: prime the cookie + token before posting.
  const tokenResp = await ctx.get('/account/api/csrf-token')
  const { csrfToken } = (await tokenResp.json()) as { csrfToken: string }

  const completeResp = await ctx.post('/payment/api/complete-order', {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
      Referer: BACKEND_URL,
    },
    data: {
      cart_items: [{ id: product.id, quantity: 1, price: product.price }],
      shipping: {
        full_name: 'Playwright Guest',
        email: SEED_EMAIL,
        address1: '300 Spec St',
        address2: '',
        city: 'Specville',
        state: 'OR',
        zipcode: '97000',
      },
    },
  })
  expect(completeResp.ok()).toBeTruthy()
  const body = (await completeResp.json()) as { success: boolean; order_id: number }
  expect(body.success).toBe(true)
  seededOrderId = body.order_id

  await ctx.dispose()
})

test('guest can look up a real order by number + email', async ({ page }) => {
  await page.goto('/check-order')

  await page.getByLabel('Order Number').fill(String(seededOrderId))
  await page.getByLabel('Order Email').fill(SEED_EMAIL)
  await page.getByRole('button', { name: /^search$/i }).click()

  // OrderCard renders an "Order #<id>" heading.
  await expect(page.getByRole('heading', { name: `Order #${seededOrderId}` })).toBeVisible()
  await expect(page.getByText('Playwright Guest')).toBeVisible()
  await expect(page.getByText(SEED_EMAIL)).toBeVisible()
})

test('guest order lookup with the wrong email surfaces a not-found error', async ({ page }) => {
  await page.goto('/check-order')

  await page.getByLabel('Order Number').fill(String(seededOrderId))
  await page.getByLabel('Order Email').fill('not-the-right-email@example.com')
  await page.getByRole('button', { name: /^search$/i }).click()

  // api_check_order returns "Order not found" on the email mismatch.
  await expect(page.getByText(/order not found/i)).toBeVisible()
  // And we never render an OrderCard.
  await expect(page.getByRole('heading', { name: /Order #/ })).toHaveCount(0)
})
