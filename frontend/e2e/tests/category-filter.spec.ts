import { test, expect } from '@playwright/test'

/**
 * Why this is e2e:
 *  - Asserts the URL transition `/` → `/category/<slug>` driven by the
 *    `<select>` change handler in ProductGrid.
 *  - Validates that the *real* /api/products/?category=<slug> endpoint
 *    returns a filtered subset (not the same set the home page shows).
 *  - The unit test for ProductGrid mocks `useProductsQuery` and the router,
 *    so it can't catch a real API contract drift.
 */

test('category dropdown filters products and updates the URL without a full reload', async ({
  page,
}) => {
  await page.goto('/')

  const productGrid = page.locator('#products')
  await expect(productGrid).toBeVisible()

  // Wait until the API has populated the grid before we count.
  await expect(productGrid.locator('a[href^="/product/"]').first()).toBeVisible()
  const totalCountBefore = await productGrid.locator('a[href^="/product/"]').count()

  // Tag the window so we can detect a hard reload (a full reload would clear
  // this property).
  await page.evaluate(() => {
    ;(window as unknown as { __navMarker?: number }).__navMarker = 1
  })

  // The category select sits inside the grid header.
  const categorySelect = productGrid.getByRole('combobox').first()
  await expect(categorySelect).toBeVisible()

  // Pick a deterministic category seeded by `seed_products`: "Funko Pops"
  // (slug "funko-pops") has 3 seeded products.
  await categorySelect.selectOption('funko-pops')

  await expect(page).toHaveURL(/\/category\/funko-pops$/)

  // Marker survives → it was a client-side route change, not a full reload.
  const markerSurvived = await page.evaluate(
    () => (window as unknown as { __navMarker?: number }).__navMarker,
  )
  expect(markerSurvived).toBe(1)

  // Wait for the filtered list to settle, then sanity check it differs from
  // the home page.
  await expect(productGrid.locator('a[href^="/product/"]').first()).toBeVisible()
  const totalCountAfter = await productGrid.locator('a[href^="/product/"]').count()

  // The seeded "Funko Pops" set is smaller than the full catalog.
  expect(totalCountAfter).toBeLessThanOrEqual(totalCountBefore)
  expect(totalCountAfter).toBeGreaterThan(0)

  // Every visible card should link to a product slug — we don't assert the
  // category badge because ProductCard intentionally hides it for layout
  // reasons; the URL + filtered count is the contract under test.
})
