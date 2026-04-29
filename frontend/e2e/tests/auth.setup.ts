import { test as setup, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import { E2E_USER } from '../fixtures/test-data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AUTH_FILE = path.resolve(__dirname, '..', '.auth', 'user.json')

/**
 * Authenticate the seeded e2e user once and persist the resulting browser
 * storage (sessionid + csrftoken cookies) to disk. The `chromium-authenticated`
 * project picks this up via `use.storageState`.
 *
 * We drive the login through the real UI so the saved state captures the same
 * cookies a real user would have (sessionid set by Django's login flow, plus
 * csrftoken set by the /account/api/csrf-token call the axios interceptor
 * triggers).
 */
setup('authenticate', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  await page.goto('/login')

  await page.getByLabel('Username').fill(E2E_USER.username)
  await page.getByLabel('Password').fill(E2E_USER.password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Login mutation succeeds → navigates to /. Wait for the navbar's
  // user dropdown to expose the seeded username (proves /account/api/check-auth
  // refetched and found the new session).
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: new RegExp(E2E_USER.username, 'i') })).toBeVisible()

  await page.context().storageState({ path: AUTH_FILE })
})
