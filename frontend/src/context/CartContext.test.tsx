import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext'
import { fetchProductBySlug } from '@/api/products'

vi.mock('@/api/products', () => ({
  fetchProductBySlug: vi.fn(() =>
    Promise.reject(Object.assign(new Error('default mock'), { isAxiosError: true })),
  ),
}))

const mockFetchProductBySlug = vi.mocked(fetchProductBySlug)

const buildAxiosError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
  })

const buildProduct = (overrides: Partial<{
  id: number
  title: string
  slug: string
  price: string
  stock: number
}> = {}) => ({
  id: 1,
  title: 'Charizard',
  slug: 'charizard',
  price: '49.99',
  stock: 5,
  units_sold: 0,
  image_url: null,
  image2_url: null,
  image3_url: null,
  image4_url: null,
  ...overrides,
})

const CartConsumer = () => {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    removedItems,
    dismissRemovedNotice,
  } = useCart()
  return (
    <div>
      <span data-testid="item-count">{getCartItemCount()}</span>
      <span data-testid="total">{getCartTotal().toFixed(2)}</span>
      <span data-testid="items">{JSON.stringify(cartItems)}</span>
      <span data-testid="removed">{JSON.stringify(removedItems)}</span>
      <button data-testid="dismiss-removed" onClick={dismissRemovedNotice}>Dismiss</button>
      <button data-testid="add-charizard" onClick={() => addToCart({
        id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5,
        units_sold: 0, image_url: null, image2_url: null, image3_url: null, image4_url: null,
      })}>
        Add Charizard
      </button>
      <button data-testid="add-pikachu" onClick={() => addToCart({
        id: 2, title: 'Pikachu', price: '9.99', slug: 'pikachu', stock: 3,
        units_sold: 0, image_url: null, image2_url: null, image3_url: null, image4_url: null,
      })}>
        Add Pikachu
      </button>
      <button data-testid="remove-charizard" onClick={() => removeFromCart(1)}>Remove Charizard</button>
      <button data-testid="update-qty" onClick={() => updateQuantity(1, 3)}>Set qty 3</button>
      <button data-testid="update-qty-zero" onClick={() => updateQuantity(1, 0)}>Set qty 0</button>
      <button data-testid="clear" onClick={() => clearCart()}>Clear</button>
      <button data-testid="add-no-stock" onClick={() => addToCart({
        id: 3, title: 'Rare', price: '99.99', slug: 'rare', stock: 0,
        units_sold: 0, image_url: null, image2_url: null, image3_url: null, image4_url: null,
      })}>
        Add no-stock
      </button>
      <button data-testid="add-exceed-stock" onClick={() => addToCart({
        id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5,
        units_sold: 0, image_url: null, image2_url: null, image3_url: null, image4_url: null,
      }, 10)}>
        Add 10 (exceeds stock)
      </button>
    </div>
  )
}

const renderCart = () => render(<CartProvider><CartConsumer /></CartProvider>)

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetchProductBySlug.mockReset()
    // Default: reconciliation is a network failure (non-404), which keeps
    // items intact and lets pre-reconciliation tests run synchronously.
    mockFetchProductBySlug.mockRejectedValue(
      Object.assign(new Error('network error'), { isAxiosError: true }),
    )
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('starts with an empty cart when localStorage is empty', () => {
      renderCart()
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total')).toHaveTextContent('0.00')
    })

    it('restores cart from localStorage on mount', () => {
      const saved = [{ id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5, quantity: 2 }]
      localStorage.setItem('cart', JSON.stringify(saved))
      renderCart()
      expect(screen.getByTestId('item-count')).toHaveTextContent('2')
    })

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('cart', 'not-valid-json{{{')
      renderCart()
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    })
  })

  describe('addToCart', () => {
    it('adds a new product to the cart', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('1')
    })

    it('increments quantity when the same product is added again', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('add-charizard').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('2')
    })

    it('does not add a product with zero stock', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-no-stock').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    })

    it('caps quantity at available stock when adding more than stock', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-exceed-stock').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('5')
    })

    it('caps cumulative quantity at stock when same item added multiple times', async () => {
      renderCart()
      const addBtn = screen.getByTestId('add-charizard')
      for (let i = 0; i < 4; i++) {
        await act(async () => addBtn.click())
      }
      for (let i = 0; i < 4; i++) {
        await act(async () => addBtn.click())
      }
      expect(screen.getByTestId('item-count')).toHaveTextContent('5')
    })

    it('can add multiple distinct products', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('add-pikachu').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('2')
    })
  })

  describe('removeFromCart', () => {
    it('removes a product from the cart', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('remove-charizard').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    })

    it('only removes the specified product', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('add-pikachu').click())
      await act(async () => screen.getByTestId('remove-charizard').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('1')
    })

    it('is a no-op when the product is not in the cart', async () => {
      renderCart()
      await act(async () => screen.getByTestId('remove-charizard').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    })
  })

  describe('updateQuantity', () => {
    it('updates the quantity of an existing cart item', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('update-qty').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('3')
    })

    it('removes the item when quantity is set to 0', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('update-qty-zero').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    })

    it('caps quantity at available stock', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('update-qty').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('3')
    })
  })

  describe('clearCart', () => {
    it('empties the cart', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('add-pikachu').click())
      await act(async () => screen.getByTestId('clear').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total')).toHaveTextContent('0.00')
    })
  })

  describe('getCartTotal', () => {
    it('calculates total correctly for a single item', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      expect(screen.getByTestId('total')).toHaveTextContent('49.99')
    })

    it('calculates total for multiple items with different quantities', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('add-pikachu').click())
      expect(screen.getByTestId('total')).toHaveTextContent('59.98')
    })

    it('returns 0 for an empty cart', () => {
      renderCart()
      expect(screen.getByTestId('total')).toHaveTextContent('0.00')
    })
  })

  describe('localStorage persistence', () => {
    it('persists cart state to localStorage', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      const stored = JSON.parse(localStorage.getItem('cart') ?? '[]')
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe(1)
    })

    it('clears localStorage when cart is cleared', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('clear').click())
      const stored = JSON.parse(localStorage.getItem('cart') ?? '[]')
      expect(stored).toHaveLength(0)
    })
  })

  describe('useCart outside provider', () => {
    it('throws when useCart is called outside CartProvider', () => {
      const BadConsumer = () => { useCart(); return null }
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<BadConsumer />)).toThrow('useCart must be used within CartProvider')
    })
  })

  describe('reconciliation on mount', () => {
    it('does not fetch anything when the cart is empty', async () => {
      renderCart()
      // Yield once so any kicked-off effects can settle.
      await act(async () => { await Promise.resolve() })
      expect(mockFetchProductBySlug).not.toHaveBeenCalled()
      expect(screen.getByTestId('removed')).toHaveTextContent('[]')
    })

    it('drops items that 404 and surfaces them via removedItems', async () => {
      const saved = [
        { id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5, quantity: 1 },
        { id: 2, title: 'Ghost', price: '1.00', slug: 'ghost-slug', stock: 1, quantity: 1 },
      ]
      localStorage.setItem('cart', JSON.stringify(saved))
      mockFetchProductBySlug.mockImplementation((slug) =>
        slug === 'ghost-slug'
          ? Promise.reject(buildAxiosError(404))
          : Promise.resolve(buildProduct({ id: 1, slug: 'charizard', stock: 5 })),
      )

      renderCart()

      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('removed').textContent ?? '[]')).toEqual(['ghost-slug'])
      })
      expect(screen.getByTestId('item-count')).toHaveTextContent('1')
    })

    it('caps quantity to live stock when stock has dropped below cart quantity', async () => {
      const saved = [
        { id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5, quantity: 5 },
      ]
      localStorage.setItem('cart', JSON.stringify(saved))
      mockFetchProductBySlug.mockResolvedValue(buildProduct({ id: 1, slug: 'charizard', stock: 2 }))

      renderCart()

      await waitFor(() => {
        expect(screen.getByTestId('item-count')).toHaveTextContent('2')
      })
      expect(screen.getByTestId('removed')).toHaveTextContent('[]')
    })

    it('drops items whose live stock is zero', async () => {
      const saved = [
        { id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5, quantity: 1 },
      ]
      localStorage.setItem('cart', JSON.stringify(saved))
      mockFetchProductBySlug.mockResolvedValue(buildProduct({ id: 1, slug: 'charizard', stock: 0 }))

      renderCart()

      await waitFor(() => {
        expect(screen.getByTestId('item-count')).toHaveTextContent('0')
      })
      expect(JSON.parse(screen.getByTestId('removed').textContent ?? '[]')).toEqual(['charizard'])
    })

    it('keeps items intact when the request fails for non-404 reasons', async () => {
      const saved = [
        { id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5, quantity: 2 },
      ]
      localStorage.setItem('cart', JSON.stringify(saved))
      mockFetchProductBySlug.mockRejectedValue(buildAxiosError(500))

      renderCart()

      await act(async () => { await Promise.resolve() })
      expect(screen.getByTestId('item-count')).toHaveTextContent('2')
      expect(screen.getByTestId('removed')).toHaveTextContent('[]')
    })

    it('clears removedItems when dismissRemovedNotice is called', async () => {
      const saved = [
        { id: 1, title: 'Ghost', price: '1.00', slug: 'ghost-slug', stock: 1, quantity: 1 },
      ]
      localStorage.setItem('cart', JSON.stringify(saved))
      mockFetchProductBySlug.mockRejectedValue(buildAxiosError(404))

      renderCart()

      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('removed').textContent ?? '[]')).toEqual(['ghost-slug'])
      })

      await act(async () => screen.getByTestId('dismiss-removed').click())
      expect(screen.getByTestId('removed')).toHaveTextContent('[]')
    })
  })
})
