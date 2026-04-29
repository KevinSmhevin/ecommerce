import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
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

import Register from './Register'
import axios from '@/config/axios'
import { authKeys } from '@/hooks/useAuthQuery'
import type { AuthUser } from '@/api/auth'

const mockedGet = axios.get as ReturnType<typeof vi.fn>
const mockedPost = axios.post as ReturnType<typeof vi.fn>

const renderRegister = (initialUser: AuthUser | null = null) => {
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
  return render(<Register />, { wrapper })
}

const fillAndSubmit = (overrides: Partial<{ username: string; email: string; password1: string; password2: string }> = {}) => {
  const vals = {
    username: 'ash',
    email: 'ash@pallet.com',
    password1: 'pikachu1',
    password2: 'pikachu1',
    ...overrides,
  }
  fireEvent.change(screen.getByLabelText(/^username$/i), { target: { name: 'username', value: vals.username } })
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { name: 'email', value: vals.email } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { name: 'password1', value: vals.password1 } })
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { name: 'password2', value: vals.password2 } })
  fireEvent.click(screen.getByRole('button', { name: /create account/i }))
}

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGet.mockResolvedValue({ data: { authenticated: false } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('form rendering', () => {
    it('renders the Create Account heading', () => {
      renderRegister()
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })

    it('renders Username, Email, Password, and Confirm Password fields', () => {
      renderRegister()
      expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('renders the submit button', () => {
      renderRegister()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('renders a link back to the login page', () => {
      renderRegister()
      const link = screen.getByRole('link', { name: /sign in/i })
      expect(link).toHaveAttribute('href', '/login')
    })
  })

  describe('field input', () => {
    it('updates the username field on input', async () => {
      const user = userEvent.setup()
      renderRegister()
      await user.type(screen.getByLabelText(/^username$/i), 'ashketchum')
      expect(screen.getByLabelText(/^username$/i)).toHaveValue('ashketchum')
    })

    it('updates the email field on input', async () => {
      const user = userEvent.setup()
      renderRegister()
      await user.type(screen.getByLabelText(/^email$/i), 'ash@pallet.com')
      expect(screen.getByLabelText(/^email$/i)).toHaveValue('ash@pallet.com')
    })
  })

  describe('form submission', () => {
    it('calls axios.post /account/api/register with the full form data on submit', async () => {
      mockedPost.mockResolvedValueOnce({ data: { success: true, message: 'Check your email' } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => {
        expect(mockedPost).toHaveBeenCalledWith('/account/api/register', {
          username: 'ash',
          email: 'ash@pallet.com',
          password1: 'pikachu1',
          password2: 'pikachu1',
        })
      })
    })
  })

  describe('successful registration', () => {
    it('shows the Account Created success screen', async () => {
      mockedPost.mockResolvedValueOnce({ data: { success: true, message: 'Check your email' } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /account created/i })).toBeInTheDocument()
      )
    })

    it('shows the email verification instruction after success', async () => {
      mockedPost.mockResolvedValueOnce({ data: { success: true, message: 'Check your email' } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByText(/check your email/i)).toBeInTheDocument()
      )
    })

    it('renders a Go to Login link on the success screen', async () => {
      mockedPost.mockResolvedValueOnce({ data: { success: true, message: 'Check your email' } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /go to login/i })
        expect(link).toHaveAttribute('href', '/login')
      })
    })

    it('navigates to / after 3 seconds on success', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false })

      mockedPost.mockResolvedValueOnce({ data: { success: true, message: 'Check your email' } })

      renderRegister()
      act(() => fillAndSubmit())

      // Flush microtasks so the mutation resolves and the success effect schedules its setTimeout
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      act(() => vi.advanceTimersByTime(3000))

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('loading state', () => {
    it('shows "Creating account..." while the request is in flight', async () => {
      mockedPost.mockReturnValueOnce(new Promise(() => {}))

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByRole('button')).toHaveTextContent('Creating account...')
      )
    })

    it('disables the submit button while loading', async () => {
      mockedPost.mockReturnValueOnce(new Promise(() => {}))

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    })
  })

  describe('failed registration', () => {
    it('displays the top-level error message on failure', async () => {
      mockedPost.mockRejectedValueOnce({
        response: { data: { error: 'A user with that username already exists.', errors: {} } },
      })

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByText('A user with that username already exists.')).toBeInTheDocument()
      )
    })

    it('displays field-level errors beneath the relevant input', async () => {
      mockedPost.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Registration failed',
            errors: { password2: ["The two password fields didn't match."] },
          },
        },
      })

      renderRegister()
      fillAndSubmit({ password2: 'different' })

      await waitFor(() =>
        expect(screen.getByText("The two password fields didn't match.")).toBeInTheDocument()
      )
    })

    it('does not navigate on failed registration', async () => {
      mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Error', errors: {} } } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('re-enables the submit button after a failed registration', async () => {
      mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Error', errors: {} } } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    })

    it('still shows the form (not the success screen) after a failure', async () => {
      mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Error', errors: {} } } })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
      expect(screen.queryByRole('heading', { name: /account created/i })).not.toBeInTheDocument()
    })
  })
})
