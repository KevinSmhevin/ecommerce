import { test, expect, request } from '@playwright/test'

import { E2E_USER, BACKEND_URL } from '../fixtures/test-data'

/**
 * Why this is e2e:
 *  - Cookies, CSRF tokens, and `withCredentials` only behave correctly inside
 *    a real HTTP stack. The unit suite stubs axios entirely; it cannot prove
 *    that Django's CsrfViewMiddleware actually rejects a missing X-CSRFToken
 *    on /account/api/login, nor that a successful login lands a `sessionid`
 *    cookie that is visible to subsequent requests.
 *  - This spec uses Playwright's APIRequestContext directly — no browser
 *    page is involved — because we're testing the network contract, not UI.
 */

test('login via the API attaches a session cookie that subsequent requests see', async () => {
  const ctx = await request.newContext({ baseURL: BACKEND_URL })

  // 1) Prime CSRF — the GET both returns the token and sets the csrftoken
  //    cookie that Django's middleware will later compare against.
  const tokenResp = await ctx.get('/account/api/csrf-token')
  expect(tokenResp.ok()).toBeTruthy()
  const { csrfToken } = (await tokenResp.json()) as { csrfToken: string }
  expect(csrfToken).toBeTruthy()

  // 2) Submit credentials with the matching X-CSRFToken header.
  const loginResp = await ctx.post('/account/api/login', {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
      Referer: BACKEND_URL,
    },
    data: { username: E2E_USER.username, password: E2E_USER.password },
  })
  expect(loginResp.ok()).toBeTruthy()
  const loginBody = (await loginResp.json()) as { success: boolean }
  expect(loginBody.success).toBe(true)

  // 3) The session cookie should now be in the context's storageState.
  const state = await ctx.storageState()
  const sessionCookie = state.cookies.find((c) => c.name === 'sessionid')
  expect(sessionCookie, 'sessionid cookie should be set after a successful login').toBeDefined()

  // 4) /account/api/check-auth should now report `authenticated: true`
  //    using only the cookies we accumulated.
  const checkResp = await ctx.get('/account/api/check-auth')
  expect(checkResp.ok()).toBeTruthy()
  const checkBody = (await checkResp.json()) as {
    authenticated: boolean
    user?: { username: string }
  }
  expect(checkBody.authenticated).toBe(true)
  expect(checkBody.user?.username).toBe(E2E_USER.username)

  await ctx.dispose()
})

test('an authenticated unsafe request without an X-CSRFToken is rejected', async () => {
  // DRF's SessionAuthentication only enforces CSRF on requests that come in
  // *with* a session — anonymous unsafe requests are deliberately allowed
  // through. So to prove the CSRF wiring is intact, we authenticate first,
  // then attempt a second unsafe request that omits the header.
  const ctx = await request.newContext({ baseURL: BACKEND_URL })

  // Establish a session.
  const tokenResp = await ctx.get('/account/api/csrf-token')
  const { csrfToken } = (await tokenResp.json()) as { csrfToken: string }
  const loginResp = await ctx.post('/account/api/login', {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
      Referer: BACKEND_URL,
    },
    data: { username: E2E_USER.username, password: E2E_USER.password },
  })
  expect(loginResp.ok()).toBeTruthy()

  // Now hit an unsafe endpoint *without* the X-CSRFToken header. DRF should
  // reject this with 403 because the request now carries a session cookie
  // and SessionAuthentication.enforce_csrf engages.
  const logoutWithoutCsrf = await ctx.post('/account/api/logout', {
    headers: {
      'Content-Type': 'application/json',
      Referer: BACKEND_URL,
    },
    data: {},
  })
  expect(logoutWithoutCsrf.status()).toBe(403)

  // Sanity: the same request *with* the header succeeds. Refetch the
  // current token first — Django may have rotated it on the rejected POST,
  // and we want this assertion to test "header presence works", not "stale
  // token survives".
  const tokenResp2 = await ctx.get('/account/api/csrf-token')
  const { csrfToken: csrfToken2 } = (await tokenResp2.json()) as { csrfToken: string }
  const logoutOk = await ctx.post('/account/api/logout', {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken2,
      Referer: BACKEND_URL,
    },
    data: {},
  })
  expect(logoutOk.ok()).toBeTruthy()

  await ctx.dispose()
})
