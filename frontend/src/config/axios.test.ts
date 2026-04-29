/**
 * Tests for the axios CSRF interceptor in src/config/axios.ts.
 *
 * The module mutates the shared axios singleton and registers an interceptor, so
 * we mock the axios package, import the module, and inspect the resulting
 * interceptor behaviour by running fake configs through the registered handler.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

interface InterceptorConfig {
  method: string
  headers: Record<string, string>
}
type InterceptorFn = (config: InterceptorConfig) => Promise<InterceptorConfig>

interface MockAxios {
  defaults: { baseURL: string; withCredentials: boolean }
  interceptors: {
    request: {
      handlers: InterceptorFn[]
      use(fn: InterceptorFn): void
    }
  }
  get: ReturnType<typeof vi.fn>
}

vi.mock('axios', () => {
  const mockAxios: MockAxios = {
    defaults: { baseURL: '', withCredentials: false },
    interceptors: {
      request: {
        handlers: [],
        use(fn: InterceptorFn) {
          this.handlers.push(fn)
        },
      },
    },
    get: vi.fn(),
  }
  return { default: mockAxios }
})

describe('axios CSRF interceptor', () => {
  let interceptorFn: InterceptorFn

  beforeEach(async () => {
    vi.resetModules()

    const axiosMock = ((await import('axios')) as unknown as { default: MockAxios }).default
    axiosMock.get = vi.fn().mockResolvedValue({ data: { csrfToken: 'test-csrf-token' } })
    axiosMock.interceptors.request.handlers = []

    await import('./axios')

    interceptorFn = axiosMock.interceptors.request.handlers[0]
  })

  it('attaches X-CSRFToken on POST requests', async () => {
    const config: InterceptorConfig = { method: 'post', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('attaches X-CSRFToken on PUT requests', async () => {
    const config: InterceptorConfig = { method: 'put', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('attaches X-CSRFToken on PATCH requests', async () => {
    const config: InterceptorConfig = { method: 'patch', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('attaches X-CSRFToken on DELETE requests', async () => {
    const config: InterceptorConfig = { method: 'delete', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBe('test-csrf-token')
  })

  it('does NOT attach X-CSRFToken on GET requests', async () => {
    const config: InterceptorConfig = { method: 'get', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBeUndefined()
  })

  it('does NOT attach X-CSRFToken on HEAD requests', async () => {
    const config: InterceptorConfig = { method: 'head', headers: {} }
    const result = await interceptorFn(config)
    expect(result.headers['X-CSRFToken']).toBeUndefined()
  })

  it('returns the config object unmodified for safe methods', async () => {
    const config: InterceptorConfig = { method: 'get', headers: { Accept: 'application/json' } }
    const result = await interceptorFn(config)
    expect(result).toEqual(config)
  })
})
