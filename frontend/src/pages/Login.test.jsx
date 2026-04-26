import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ------------------------------------------------------------------
// Mock AuthContext and react-router-dom BEFORE importing the component.
// Each test can override mockLogin behaviour via vi.fn().
// ------------------------------------------------------------------
const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    login: mockLogin,
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import Login from './Login'
import { useAuth } from '../context/AuthContext'

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: unauthenticated
    useAuth.mockReturnValue({ user: null, login: mockLogin })
  })

  // -------------------------
  // Rendering
  // -------------------------
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
      // No error classes visible initially
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument()
    })
  })

  // -------------------------
  // Redirect when already logged in
  // -------------------------
  describe('redirect when already authenticated', () => {
    it('navigates to / immediately when user is already set', async () => {
      useAuth.mockReturnValue({ user: { username: 'ash', email: 'ash@test.com' }, login: mockLogin })
      renderLogin()
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    })
  })

  // -------------------------
  // Form interaction
  // -------------------------
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

  // -------------------------
  // Successful submission
  // -------------------------
  describe('successful login', () => {
    it('calls login with username and password on form submit', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ success: true })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(mockLogin).toHaveBeenCalledWith('ash', 'pikachu')
    })

    it('navigates to / on successful login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ success: true })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    })

    it('shows "Signing in..." text while the request is pending', async () => {
      const user = userEvent.setup()
      mockLogin.mockReturnValueOnce(new Promise(() => {}))

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Signing in...'))
    })

    it('disables the submit button while loading', async () => {
      const user = userEvent.setup()
      mockLogin.mockReturnValueOnce(new Promise(() => {}))

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'pikachu')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    })
  })

  // -------------------------
  // Failed submission
  // -------------------------
  describe('failed login', () => {
    it('shows the error message returned by the login function', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ success: false, message: 'Invalid credentials' })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
    })

    it('does not navigate on failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ success: false, message: 'Invalid credentials' })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('re-enables the submit button after a failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ success: false, message: 'Bad credentials' })

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    })

    it('clears a previous error when a new submission starts', async () => {
      const user = userEvent.setup()
      mockLogin
        .mockResolvedValueOnce({ success: false, message: 'Invalid credentials' })
        .mockReturnValueOnce(new Promise(() => {}))

      renderLogin()
      await user.type(screen.getByLabelText(/username/i), 'ash')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())

      // Submit again — error should clear immediately
      await user.click(screen.getByRole('button'))
      await waitFor(() => expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument())
    })
  })
})
