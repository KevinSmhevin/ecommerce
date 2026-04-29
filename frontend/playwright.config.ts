import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Pokebin's React + Django e2e suite.
 *
 * Strategy:
 *   - One `webServer` block runs Vite (`npm run dev`) on port 5173.
 *   - The Django backend is a documented manual prerequisite, NOT a webServer
 *     entry, because it requires a Python venv, .env, migrations, and seeded
 *     data. Wiring all of that into Playwright's webServer is significantly
 *     more flaky than asking the developer to start it once. See
 *     `e2e/README.md` for the exact prerequisite commands.
 *   - `auth.setup.ts` is a setup project that logs the seeded e2e user in
 *     once and persists storage state to `e2e/.auth/user.json`. The
 *     `chromium-authenticated` project consumes that storage state.
 */

// Use a non-default port so the suite never collides with a long-running
// `npm run dev` on 5173. Vite's proxies for /api, /account, /payment still
// point at the Django backend on 127.0.0.1:8000 regardless of frontend port.
const PORT = Number(process.env.PW_PORT ?? 5273)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker locally avoids cross-worker collisions on the seeded
  // ShippingAddress (one row per user).
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Excludes setup file and the authenticated-only specs. Authenticated
      // specs live next to their unauthenticated siblings and use a `*.auth.spec.ts`
      // extension to make the boundary obvious in test reports.
      testIgnore: /.*\.auth\.spec\.ts/,
    },
    {
      name: 'chromium-authenticated',
      testMatch: /.*\.auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort --host 127.0.0.1`,
    url: BASE_URL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
