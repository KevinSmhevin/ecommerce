import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import axios from '../config/axios'

// -----------------------------------------------------------------------
// renderWithAuth: renders a consumer component inside AuthProvider.
// Returns helpers so tests can drive state and make assertions.
// -----------------------------------------------------------------------

/**
 * Minimal consumer that surfaces every piece of state we care about.
 * Action callbacks are assigned to buttons so we can fire them via DOM.
 */
const buildConsumer = (onLogin, onLogout, onRegister) => {
  const Consumer = () => {
    const { user, loading, login, logout, register } = useAuth()

    return (
      <div>
        <span data-testid="loading">{String(loading)}</span>
        <span data-testid="user">{user ? user.username : 'null'}</span>
        <button
          data-testid="login"
          onClick={async () => {
            const result = await login('testuser', 'pass123')
            onLogin?.(result)
          }}
        >
          Login
        </button>
        <button
          data-testid="logout"
          onClick={async () => {
            await logout()
            onLogout?.()
          }}
        >
          Logout
        </button>
        <button
          data-testid="register"
          onClick={async () => {
            const result = await register({ username: 'u', email: 'e@e.com', password1: 'p', password2: 'p' })
            onRegister?.(result)
          }}
        >
          Register
        </button>
      </div>
    )
  }
  return Consumer
}

const renderAuth = (callbacks = {}) => {
  const Consumer = buildConsumer(callbacks.onLogin, callbacks.onLogout, callbacks.onRegister)
  return render(<AuthProvider><Consumer /></AuthProvider>)
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // -------------------------
  // Initial auth check
  // -------------------------
  describe('initial auth check (checkAuth)', () => {
    it('sets user when checkAuth returns authenticated=true', async () => {
      axios.get.mockResolvedValueOnce({
        data: { authenticated: true, user: { username: 'testuser', email: 'test@test.com' } },
      })
      renderAuth()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })

    it('leaves user null when checkAuth returns authenticated=false', async () => {
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })
      renderAuth()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('leaves user null and stops loading when checkAuth request fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'))
      renderAuth()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('starts in loading=true state before auth check resolves', async () => {
      axios.get.mockReturnValueOnce(new Promise(() => {})) // never resolves
      renderAuth()
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
    })
  })

  // -------------------------
  // login
  // -------------------------
  describe('login', () => {
    it('sets user and returns success on successful login', async () => {
      // checkAuth → unauthenticated
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })
      // login POST → success
      axios.post.mockResolvedValueOnce({
        data: { success: true, user: { username: 'testuser', email: 't@t.com' }, message: 'OK' },
      })

      let loginResult
      renderAuth({ onLogin: (r) => { loginResult = r } })
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

      await act(async () => screen.getByTestId('login').click())

      expect(loginResult.success).toBe(true)
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })

    it('returns success:false and does not set user on login failure', async () => {
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })
      axios.post.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } })

      let loginResult
      renderAuth({ onLogin: (r) => { loginResult = r } })
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

      await act(async () => screen.getByTestId('login').click())

      expect(loginResult.success).toBe(false)
      expect(loginResult.message).toBe('Invalid credentials')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('returns generic error message when server sends no error detail', async () => {
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })
      axios.post.mockRejectedValueOnce({ response: undefined })

      let loginResult
      renderAuth({ onLogin: (r) => { loginResult = r } })
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

      await act(async () => screen.getByTestId('login').click())

      expect(loginResult.success).toBe(false)
      expect(loginResult.message).toBe('Login failed')
    })
  })

  // -------------------------
  // logout
  // -------------------------
  describe('logout', () => {
    it('clears user on successful logout', async () => {
      // checkAuth → authenticated
      axios.get.mockResolvedValueOnce({
        data: { authenticated: true, user: { username: 'testuser', email: 'test@test.com' } },
      })
      // logout POST → success
      axios.post.mockResolvedValueOnce({ data: { success: true } })
      // checkAuth re-run after logout → unauthenticated
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })

      renderAuth()
      await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('testuser'))

      await act(async () => screen.getByTestId('logout').click())

      await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('null'))
    })

    it('clears user even when logout API call fails', async () => {
      axios.get.mockResolvedValueOnce({
        data: { authenticated: true, user: { username: 'testuser', email: 'test@test.com' } },
      })
      axios.post.mockRejectedValueOnce(new Error('Network error'))

      renderAuth()
      await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('testuser'))

      await act(async () => screen.getByTestId('logout').click())

      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  // -------------------------
  // register
  // -------------------------
  describe('register', () => {
    it('returns success:true on successful registration', async () => {
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })
      axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Verify your email' } })

      let registerResult
      renderAuth({ onRegister: (r) => { registerResult = r } })
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

      await act(async () => screen.getByTestId('register').click())

      expect(registerResult.success).toBe(true)
      expect(registerResult.message).toBe('Verify your email')
    })

    it('returns success:false with errors on failed registration', async () => {
      axios.get.mockResolvedValueOnce({ data: { authenticated: false } })
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Passwords do not match',
            errors: { password2: ['Passwords do not match'] },
          },
        },
      })

      let registerResult
      renderAuth({ onRegister: (r) => { registerResult = r } })
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

      await act(async () => screen.getByTestId('register').click())

      expect(registerResult.success).toBe(false)
      expect(registerResult.message).toBe('Passwords do not match')
      expect(registerResult.errors).toEqual({ password2: ['Passwords do not match'] })
    })
  })

  // -------------------------
  // Hook outside provider
  // -------------------------
  describe('useAuth outside provider', () => {
    it('throws when called outside AuthProvider', () => {
      const Bad = () => { useAuth(); return null }
      expect(() => render(<Bad />)).toThrow('useAuth must be used within an AuthProvider')
    })
  })
})
