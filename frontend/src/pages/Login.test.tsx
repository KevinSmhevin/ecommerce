import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const mockNavigate = vi.fn()

vi.mock('@/config/axios', () => {
  const isAxiosError = (err: unknown): err is { response?: { data?: { error?: string; errors?: unknown } } } =>
    err !== null && typeof err === 'object' && 'response' in (err as Record<string, unknown>)
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      defaults: {},
      interceptors: { request: { use: vi.fn() } },
      isAxiosError,
    },
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import Login from './Login'
import axios from '@/config/axios'
import { authKeys } from '@/hooks/useAuthQuery'
import type { AuthUser } from '@/api/auth'

const mockedGet = axios.get as ReturnType<typeof vi.fn>
const mockedPost = axios.post as ReturnType<typeof vi.fn>

const renderLogin = (initialUser: AuthUser | null = null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  if (initialUser) queryClient.setQueryData(authKeys.session(), initialUser)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<Login />, { wrapper })
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGet.mockResolvedValue({ data: { authenticated: false } })
  })

  describe('form rendering', () => {
    it('renders the Sign In heading', () => {
      renderLogin()
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders a username input', () => {
      renderLogin()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    it('renders a password input', () => {
      renderLogin()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('renders the submit button', () => {
      renderLogin()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders a link to the register page', () => {
      renderLogin()
      const link = screen.getByRole('link', { name: /create one/i })
      expect(link).toHaveAttribute('href', '/register')
    })

    it('does not show an error alert initially', () => {
      renderLogin()
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument()
    })
  })

  describe('redirect when already authenticated', () => {
    it('navigates to / immediately when user is already in the cache', async () => {
      renderLogin({ username: 'ash', email: 'ash@test.com' })
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    })
  })

  describe('form interaction', () => {
    it('updates username field on user input', async () => {
      const user = userEvent.setup()
      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ashketchum')
      expect(screen.getByLabelText(/username/i)).toHaveValue('ashketchum')
    })

    it('updates password field on user input', async () => {
      const user = userEvent.setup()
      renderLogin()
      await user.type(screen.getByLabelText(/password/i), 'pikachu123')
      expect(screen.getByLabelText(/password/i)).toHaveValue('pikachu123')
    })
  })

  describe('successful login', () => {
    it('calls axios.post /account/api/login with username and password on submit', async () => {
      const user = userEvent.setup()
      mockedPost.mockResolvedValueOnce({ data: { success: true, user: { username: 'ash', email: 'ash@x.com' } } })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockedPost).toHaveBeenCalledWith('/account/api/login', { username: 'ash', password: 'pikachu' })
      })
    })

    it('navigates to / on successful login', async () => {
      const user = userEvent.setup()
      mockedPost.mockResolvedValueOnce({ data: { success: true, user: { username: 'ash', email: 'ash@x.com' } } })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    })

    it('shows "Signing in..." text while the request is pending', async () => {
      const user = userEvent.setup()
      mockedPost.mockReturnValueOnce(new Promise(() => {}))

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Signing in...'))
    })

    it('disables the submit button while loading', async () => {
      const user = userEvent.setup()
      mockedPost.mockReturnValueOnce(new Promise(() => {}))

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    })
  })

  describe('failed login', () => {
    it('shows the error message returned by the API', async () => {
      const user = userEvent.setup()
      mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
    })

    it('does not navigate on failed login', async () => {
      const user = userEvent.setup()
      mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('re-enables the submit button after a failed login', async () => {
      const user = userEvent.setup()
      mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Bad credentials' } } })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    })

    it('clears a previous error when a new submission starts', async () => {
      const user = userEvent.setup()
      mockedPost
        .mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } })
        .mockReturnValueOnce(new Promise(() => {}))

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())

      await user.click(screen.getByRole('button'))
      await waitFor(() => expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument())
    })
  })
})
