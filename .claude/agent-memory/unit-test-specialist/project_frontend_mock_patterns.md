---
name: Frontend mock patterns
description: Established patterns for mocking axios, AuthContext, and react-router-dom in Pokebin frontend tests
type: project
---

## Mocking the axios config module

The axios module at `src/config/axios.js` mutates the global axios singleton and registers a request interceptor. Mock it like this in any test that uses AuthContext, AppContext, or NavbarStadium:

```js
vi.mock('../config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '', withCredentials: false },
    interceptors: { request: { use: vi.fn(), handlers: [] } },
  },
}))
import axios from '../config/axios'
```

The `defaults` and `interceptors` stubs are needed for NavbarStadium (which imports AuthContext which imports axios.js at module level).

## Mocking AuthContext in page tests

When testing pages that consume `useAuth` (Login, Register), mock the entire module and use `vi.fn()` so `beforeEach` can set different return values per test:

```js
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, login: mockLogin })),
}))
import { useAuth } from '../context/AuthContext'

beforeEach(() => {
  useAuth.mockReturnValue({ user: null, login: mockLogin })
})
```

## Mocking react-router-dom

```js
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
```

Always wrap components in `<MemoryRouter>` when testing pages.

## AuthContext / AppContext test consumer pattern

Render a Consumer component inside the real Provider. Capture action results via callbacks passed to the consumer button handlers — avoids the `renderHook` API and works cleanly with `act`.

## Fake timers + waitFor

`vi.useFakeTimers()` breaks `waitFor` (which uses `setTimeout` internally). Pattern that works:

```js
vi.useFakeTimers({ shouldAdvanceTime: false })
// ... render and submit (inside act) ...
await act(async () => { await Promise.resolve() })  // flush resolved Promises
act(() => vi.advanceTimersByTime(3000))              // advance fake clock
// assert navigate was called
```

Always call `vi.useRealTimers()` in `afterEach` so timer leaks don't break subsequent tests.

## Form interaction: fireEvent vs userEvent

`userEvent.type()` is character-by-character and can time out (5s default) when filling 4+ fields in many sequential tests. Prefer `fireEvent.change` for multi-field forms in test suites with many tests. `userEvent` is fine for 1-2 fields or when the exact interaction sequence matters.

**Why:** Discovered during Register.test.jsx — tests 10-18 were timing out because userEvent was consuming the 5s limit across 4 fields × 8-9 chars each.
