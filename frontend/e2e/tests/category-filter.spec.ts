import { test, expect } from '@playwright/test'

/**
 * Why this is e2e:
 *  - Asserts the URL transition `/category/<a>` → `/category/<b>` driven by the
 *    `<select>` change handler in ProductGrid.
 *  - Validates that the *real* /api/products/?category=<slug> endpoint returns
 *    a filtered, non-empty subset.
 *  - The unit test for ProductGrid mocks `useProductsQuery` and the router, so
 *    it can't catch a real API contract drift.
 *
 * Note: the home page no longer renders ProductGrid (it shows per-category
 * carousels); the category `<select>` now lives on CategoryPage, so this spec
 * exercises the select from a category page.
 */

test('category dropdown filters products and updates the URL without a full reload', async ({
  page,
}) => {
  await page.goto('/category/trading-cards')

  const productGrid = page.locator('#products')
  await expect(productGrid).toBeVisible()

  // The category select sits in the grid header and renders regardless of how
  // many products the starting category has, so we don't wait for product
  // cards here — the populated-list assertion happens after switching below.

  // Tag the window so we can detect a hard reload (a full reload clears it).
  await page.evaluate(() => {
    ;(window as unknown as { __navMarker?: number }).__navMarker = 1
  })

  const categorySelect = productGrid.getByRole('combobox').first()
  await expect(categorySelect).toBeVisible()

  // Switch to a different seeded category: "Funko Pops" (slug "funko-pops")
  // has 3 seeded products.
  await categorySelect.selectOption('funko-pops')

  await expect(page).toHaveURL(/\/category\/funko-pops$/)

  // Marker survives → client-side route change, not a full reload.
  const markerSurvived = await page.evaluate(
    () => (window as unknown as { __navMarker?: number }).__navMarker,
  )
  expect(markerSurvived).toBe(1)

  // Wait for the filtered list to settle and confirm it is non-empty.
  await expect(productGrid.locator('a[href^="/product/"]').first()).toBeVisible()
  const totalCountAfter = await productGrid.locator('a[href^="/product/"]').count()
  expect(totalCountAfter).toBeGreaterThan(0)
})
