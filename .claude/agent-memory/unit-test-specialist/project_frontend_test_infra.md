---
name: Frontend test infrastructure
description: Test runner, libraries, config, and file locations established for the Pokebin frontend
type: project
---

Vitest 1.6 + React Testing Library 14 + jsdom 24 were installed as of 2026-04-26. Test script is `npm test -- --run` (one-shot) from `frontend/`. Interactive watch mode is `npm test`.

**Config:** Vitest config lives inside `frontend/vite.config.js` under the `test` block (`environment: 'jsdom'`, `setupFiles: ['./src/test/setup.js']`, `globals: true`).

**Setup file:** `frontend/src/test/setup.js` imports `@testing-library/jest-dom`.

**Test file locations (all under `frontend/src/`):**
- `lib/utils.test.js`
- `config/axios.test.js`
- `context/CartContext.test.jsx`
- `context/AuthContext.test.jsx`
- `context/AppContext.test.jsx`
- `components/Alert.test.jsx`
- `components/Pagination.test.jsx`
- `components/ProductCard.test.jsx`
- `components/NavbarStadium.test.jsx`
- `pages/Login.test.jsx`
- `pages/Register.test.jsx`

**Total coverage:** 146 tests, all passing.

**Why:** No test infrastructure existed before this session. Set up from scratch.

**How to apply:** When adding new frontend tests, follow these file locations and the mock patterns documented in `project_frontend_mock_patterns.md`.
