---
name: Pokebin port 5173 collisions
description: Port 5173 frequently has another long-running Vite/Helpdesk dev server; the e2e suite uses 5273 to avoid the collision
type: feedback
---

Avoid port 5173 for the e2e webServer on this developer's machine. Their other project ("Helpdesk", login page text "Sign in to Helpdesk") binds 5173 on `[::1]` and Playwright's `reuseExistingServer: !process.env.CI` will silently latch onto the wrong app.

**Why:** I caught this the hard way during initial test runs — every spec failed with mysterious "element not found" errors because Playwright was driving the wrong app. The error context's page snapshot showing "Sign in to Helpdesk" was the giveaway.

**How to apply:** When configuring Playwright `webServer` for any project on this machine, pick a non-default port (we landed on 5273) and pass `--strictPort --host 127.0.0.1` to Vite so it fails loudly if even that port is taken. Bind to `127.0.0.1` (not `localhost`) so the IPv4 cookie domain matches the Django backend at `127.0.0.1:8000`.
