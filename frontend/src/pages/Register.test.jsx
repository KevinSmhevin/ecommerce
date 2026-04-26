import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    register: mockRegister,
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import Register from './Register'
import { useAuth } from '../context/AuthContext'

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )

/**
 * Fill every required field using fireEvent (fast, synchronous) and click submit.
 * Register.jsx uses controlled inputs with `name` attributes — fireEvent.change
 * fires the onChange handler that calls setFormData.
 */
const fillAndSubmit = (overrides = {}) => {
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
    useAuth.mockReturnValue({ user: null, register: mockRegister })
  })

  afterEach(() => {
    // Ensure real timers are restored even if a test throws mid-way
    vi.useRealTimers()
  })

  // -------------------------
  // Rendering
  // -------------------------
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

  // -------------------------
  // Field input
  // -------------------------
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

  // -------------------------
  // Calls register with correct data
  // -------------------------
  describe('form submission', () => {
    it('calls register with the full form data on submit', async () => {
      mockRegister.mockResolvedValueOnce({ success: true, message: 'Check your email' })

      renderRegister()
      fillAndSubmit()

      expect(mockRegister).toHaveBeenCalledWith({
        username: 'ash',
        email: 'ash@pallet.com',
        password1: 'pikachu1',
        password2: 'pikachu1',
      })
    })
  })

  // -------------------------
  // Successful registration
  // -------------------------
  describe('successful registration', () => {
    it('shows the Account Created success screen', async () => {
      mockRegister.mockResolvedValueOnce({ success: true, message: 'Check your email' })

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /account created/i })).toBeInTheDocument()
      )
    })

    it('shows the email verification instruction after success', async () => {
      mockRegister.mockResolvedValueOnce({ success: true, message: 'Check your email' })

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByText(/check your email/i)).toBeInTheDocument()
      )
    })

    it('renders a Go to Login link on the success screen', async () => {
      mockRegister.mockResolvedValueOnce({ success: true, message: 'Check your email' })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /go to login/i })
        expect(link).toHaveAttribute('href', '/login')
      })
    })

    // The setTimeout-based navigation is tested using fake timers.
    // We guard carefully: useFakeTimers → render → submit → let Promise resolve
    // with real microtask queue → then advance fake timers.
    it('navigates to / after 3 seconds on success', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false })

      mockRegister.mockResolvedValueOnce({ success: true, message: 'Check your email' })

      renderRegister()

      // fillAndSubmit inside act so React can flush the synchronous state updates
      act(() => fillAndSubmit())

      // Flush the resolved Promise (mockRegister) — must flush microtasks
      await act(async () => {
        await Promise.resolve()
      })

      // At this point setSuccess(true) should have fired; advance the 3s timer
      act(() => vi.advanceTimersByTime(3000))

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  // -------------------------
  // Loading state
  // -------------------------
  describe('loading state', () => {
    it('shows "Creating account..." while the request is in flight', async () => {
      mockRegister.mockReturnValueOnce(new Promise(() => {})) // never resolves

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByRole('button')).toHaveTextContent('Creating account...')
      )
    })

    it('disables the submit button while loading', async () => {
      mockRegister.mockReturnValueOnce(new Promise(() => {}))

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    })
  })

  // -------------------------
  // Failed registration
  // -------------------------
  describe('failed registration', () => {
    it('displays the top-level error message on failure', async () => {
      mockRegister.mockResolvedValueOnce({
        success: false,
        message: 'A user with that username already exists.',
        errors: {},
      })

      renderRegister()
      fillAndSubmit()

      await waitFor(() =>
        expect(screen.getByText('A user with that username already exists.')).toBeInTheDocument()
      )
    })

    it('displays field-level errors beneath the relevant input', async () => {
      mockRegister.mockResolvedValueOnce({
        success: false,
        message: 'Registration failed',
        errors: { password2: ["The two password fields didn't match."] },
      })

      renderRegister()
      fillAndSubmit({ password2: 'different' })

      await waitFor(() =>
        expect(screen.getByText("The two password fields didn't match.")).toBeInTheDocument()
      )
    })

    it('does not navigate on failed registration', async () => {
      mockRegister.mockResolvedValueOnce({ success: false, message: 'Error', errors: {} })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('re-enables the submit button after a failed registration', async () => {
      mockRegister.mockResolvedValueOnce({ success: false, message: 'Error', errors: {} })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    })

    it('still shows the form (not the success screen) after a failure', async () => {
      mockRegister.mockResolvedValueOnce({ success: false, message: 'Error', errors: {} })

      renderRegister()
      fillAndSubmit()

      await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
      expect(screen.queryByRole('heading', { name: /account created/i })).not.toBeInTheDocument()
    })
  })
})
