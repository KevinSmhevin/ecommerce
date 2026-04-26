/**
 * Tests for the axios CSRF interceptor in src/config/axios.js.
 *
 * The module mutates the shared axios singleton and registers an interceptor, so
 * we import it once and inspect the resulting interceptor behaviour by running
 * request configs through the internal interceptor handler directly.
 *
 * Strategy:
 *  - Mock the global axios.get so the CSRF-token fetch never hits the network.
 *  - Grab the interceptor added to axios.interceptors.request after importing
 *    the module.
 *  - Feed it fake config objects and assert whether X-CSRFToken is attached.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Prevent the module-level getCsrfToken() from making real network calls.
// We provide a fake token on the first call and verify it lands in headers.
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios')

  // Build a minimal axios-like object so the module under test can register
  // interceptors and call axios.get without hitting the network.
  const mockAxios = {
    defaults: { baseURL: '', withCredentials: false },
    interceptors: {
      request: {
        handlers: [],
        use(fn) {
          this.handlers.push(fn)
        },
      },
    },
    get: vi.fn(),
  }

  return { default: mockAxios }
})

describe('axios CSRF interceptor', () => {
  let interceptorFn

  beforeEach(async () => {
    // Reset the module registry so each test starts with a fresh module
    vi.resetModules()

    // Provide a fresh axios mock for this test run
    const axiosMock = (await import('axios')).default
    axiosMock.get = vi.fn().mockResolvedValue({ data: { csrfToken: 'test-csrf-token' } })
    axiosMock.interceptors.request.handlers = []

    // Import the module — this registers the interceptor on our mock
    await import('./axios.js')

    // Grab the registered interceptor function
    interceptorFn = axiosMock.interceptors.request.handlers[0]
  })

  it('attaches X-CSRFToken on POST requests', async () => {
    const config = { method: 'post', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('attaches X-CSRFToken on PUT requests', async () => {
    const config = { method: 'put', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('attaches X-CSRFToken on PATCH requests', async () => {
    const config = { method: 'patch', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('attaches X-CSRFToken on DELETE requests', async () => {
    const config = { method: 'delete', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('does NOT attach X-CSRFToken on GET requests', async () => {
    const config = { method: 'get', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBeUndefined()
  })

  it('does NOT attach X-CSRFToken on HEAD requests', async () => {
    const config = { method: 'head', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBeUndefined()
  })

  it('returns the config object unmodified for safe methods', async () => {
    const config = { method: 'get', headers: { Accept: 'application/json' } }
    const result = await interceptorFn(config)
    expect(result).toEqual(config)
  })
})
