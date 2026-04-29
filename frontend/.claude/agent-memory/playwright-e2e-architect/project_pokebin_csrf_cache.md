---
name: Pokebin axios CSRF cache bug
description: frontend/src/config/axios.ts caches the masked CSRF token in module scope and never refreshes after Django rotates the cookie on login; logout via the UI 403s as a result
type: project
---

`frontend/src/config/axios.ts` keeps `csrfToken` at module scope. On the first unsafe request it fetches `/account/api/csrf-token`, caches the masked token, and reuses it forever. Django's `login()` calls `rotate_token()` inside the API login handler, which assigns a new csrftoken cookie. The cached masked token is now bound to the OLD cookie's secret and decodes to nothing meaningful against the rotated cookie — every subsequent unsafe request 403s with "CSRF token from the 'X-Csrftoken' HTTP header incorrect."

**Why:** Discovered while writing the Playwright `auth-flow.spec.ts` logout test (2026-04-29). The full UI flow (login → dropdown → logout) consistently 403s. Manual reproduction via curl confirms: post-login cookie != pre-login cookie, and a token fetched pre-login does not validate.

**How to apply:**
- The `e2e/tests/auth-flow.spec.ts` "logout from the navbar dropdown" test is intentionally `test.fixme(...)` until this is fixed. When you fix it, remove the `.fixme` and the FIXME comment.
- Likely fix shapes: clear `csrfToken` after a successful login/logout response, or stop caching at all and read the value from the cookie on every unsafe request.
- This bug affects production users who chain unsafe requests in a single page session (e.g., login then complete-order). It is not just a test artifact.
