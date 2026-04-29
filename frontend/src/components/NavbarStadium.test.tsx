import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NavbarStadium from './NavbarStadium'
import { CartProvider } from '@/context/CartContext'

vi.mock('@/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '', withCredentials: false },
    interceptors: { request: { use: vi.fn(), handlers: [] } },
  },
}))

import axios from '@/config/axios'

const mockedGet = axios.get as ReturnType<typeof vi.fn>
const mockedPost = axios.post as ReturnType<typeof vi.fn>

const renderNavbar = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartProvider>
          <NavbarStadium />
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('NavbarStadium component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockedGet.mockResolvedValue({ data: { authenticated: false } })
  })

  describe('brand logo', () => {
    it('renders the POKEBIN brand name', async () => {
      renderNavbar()
      await waitFor(() => expect(screen.getByText('POKEBIN')).toBeInTheDocument())
    })

    it('logo links to the home page', async () => {
      renderNavbar()
      await waitFor(() => {
        const logoLink = screen.getByRole('link', { name: /pokebin/i })
        expect(logoLink).toHaveAttribute('href', '/')
      })
    })
  })

  describe('navigation links (unauthenticated)', () => {
    it('renders a Cart link', async () => {
      renderNavbar()
      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /cart/i })
        expect(links.length).toBeGreaterThan(0)
      })
    })

    it('renders an Orders link', async () => {
      renderNavbar()
      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /orders/i })
        expect(links.length).toBeGreaterThan(0)
      })
    })

    it('renders a Login link when unauthenticated', async () => {
      renderNavbar()
      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /login/i })
        expect(links.length).toBeGreaterThan(0)
      })
    })

    it('renders a Sign Up link when unauthenticated', async () => {
      renderNavbar()
      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /sign up/i })
        expect(links.length).toBeGreaterThan(0)
      })
    })

    it('does not render a username when unauthenticated', async () => {
      renderNavbar()
      await waitFor(() => expect(screen.getByText('POKEBIN')).toBeInTheDocument())
      await waitFor(() => expect(mockedGet).toHaveBeenCalled())
      expect(screen.queryByText('ashketchum')).not.toBeInTheDocument()
    })
  })

  describe('navigation links (authenticated)', () => {
    it('renders the username in the navbar when authenticated', async () => {
      mockedGet.mockResolvedValue({
        data: { authenticated: true, user: { username: 'ashketchum', email: 'ash@pallet.com' } },
      })
      renderNavbar()
      await waitFor(() => expect(screen.getAllByText('ashketchum').length).toBeGreaterThan(0))
    })

    it('does not render the Login link when authenticated', async () => {
      mockedGet.mockResolvedValue({
        data: { authenticated: true, user: { username: 'ashketchum', email: 'ash@pallet.com' } },
      })
      renderNavbar()
      await waitFor(() => expect(screen.getAllByText('ashketchum').length).toBeGreaterThan(0))
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument()
    })

    it('does not render the Sign Up link when authenticated', async () => {
      mockedGet.mockResolvedValue({
        data: { authenticated: true, user: { username: 'ashketchum', email: 'ash@pallet.com' } },
      })
      renderNavbar()
      await waitFor(() => expect(screen.getAllByText('ashketchum').length).toBeGreaterThan(0))
      expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument()
    })
  })

  describe('cart item count badge', () => {
    it('does not show a cart badge when the cart is empty', async () => {
      renderNavbar()
      await waitFor(() => expect(screen.getByText('POKEBIN')).toBeInTheDocument())
      expect(screen.queryByText('3')).not.toBeInTheDocument()
    })

    it('shows the cart item count badge when cart has items', async () => {
      const cart = [{ id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5, quantity: 3 }]
      localStorage.setItem('cart', JSON.stringify(cart))

      renderNavbar()
      await waitFor(() => {
        const badges = screen.getAllByText('3')
        expect(badges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Instagram link', () => {
    it('renders an Instagram link with correct href', async () => {
      renderNavbar()
      await waitFor(() => {
        const igLink = screen.getByRole('link', { name: /instagram/i })
        expect(igLink).toHaveAttribute('href', 'https://www.instagram.com/poke_bin/')
      })
    })

    it('Instagram link opens in a new tab', async () => {
      renderNavbar()
      await waitFor(() => {
        const igLink = screen.getByRole('link', { name: /instagram/i })
        expect(igLink).toHaveAttribute('target', '_blank')
        expect(igLink).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })

  describe('logout', () => {
    it('calls the logout API when logout button is clicked', async () => {
      const user = userEvent.setup()

      mockedGet.mockResolvedValue({
        data: { authenticated: true, user: { username: 'ashketchum', email: 'ash@pallet.com' } },
      })
      mockedPost.mockResolvedValueOnce({ data: { success: true } })

      renderNavbar()
      await waitFor(() => expect(screen.getAllByText('ashketchum').length).toBeGreaterThan(0))

      const usernameBtn = screen.getByRole('button', { name: /ashketchum/i })
      await act(async () => user.click(usernameBtn))

      const logoutBtn = screen.getByRole('button', { name: /logout/i })
      await act(async () => user.click(logoutBtn))

      await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/account/api/logout', {}))
    })
  })
})
