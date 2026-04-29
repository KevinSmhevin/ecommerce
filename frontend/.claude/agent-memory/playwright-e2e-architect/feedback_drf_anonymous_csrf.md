---
name: DRF SessionAuthentication only enforces CSRF when a session is present
description: A POST without X-CSRFToken from an anonymous client is NOT 403'd by DRF; the CSRF check only kicks in when SessionAuthentication has authenticated the request via a session cookie
type: feedback
---

`rest_framework.authentication.SessionAuthentication` calls `enforce_csrf` only when it has authenticated the request via the session. For a fully anonymous unsafe request (no sessionid cookie), DRF returns the view as if no CSRF protection existed, and Django's CsrfViewMiddleware also lets it through because DRF's view is `csrf_exempt` (DRF handles CSRF inside `SessionAuthentication`, not via middleware).

**Why:** I initially wrote a test asserting that `POST /account/api/login` without an X-CSRFToken returns 403. It returned 200 — login succeeded. Confused me until I traced DRF's auth flow.

**How to apply:** When testing CSRF wiring on a DRF endpoint, log the user in first, then make the unsafe call without the header. The CSRF middleware engages only when there's a session to attribute the request to. The current `csrf-session.spec.ts` "an authenticated unsafe request without an X-CSRFToken is rejected" test reflects this.
