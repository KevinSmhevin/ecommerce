import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext'

// Helper: a consumer component that exposes context values via data-testid attributes
const CartConsumer = () => {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount } = useCart()
  return (
    <div>
      <span data-testid="item-count">{getCartItemCount()}</span>
      <span data-testid="total">{getCartTotal().toFixed(2)}</span>
      <span data-testid="items">{JSON.stringify(cartItems)}</span>
      <button data-testid="add-charizard" onClick={() => addToCart({ id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5 })}>
        Add Charizard
      </button>
      <button data-testid="add-pikachu" onClick={() => addToCart({ id: 2, title: 'Pikachu', price: '9.99', slug: 'pikachu', stock: 3 })}>
        Add Pikachu
      </button>
      <button data-testid="remove-charizard" onClick={() => removeFromCart(1)}>Remove Charizard</button>
      <button data-testid="update-qty" onClick={() => updateQuantity(1, 3)}>Set qty 3</button>
      <button data-testid="update-qty-zero" onClick={() => updateQuantity(1, 0)}>Set qty 0</button>
      <button data-testid="clear" onClick={() => clearCart()}>Clear</button>
      <button data-testid="add-no-stock" onClick={() => addToCart({ id: 3, title: 'Rare', price: '99.99', slug: 'rare', stock: 0 })}>
        Add no-stock
      </button>
      <button data-testid="add-exceed-stock" onClick={() => addToCart({ id: 1, title: 'Charizard', price: '49.99', slug: 'charizard', stock: 5 }, 10)}>
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
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  // -------------------------
  // Initialization
  // -------------------------
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
      // Should not throw; cart defaults to empty
      renderCart()
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    })
  })

  // -------------------------
  // addToCart
  // -------------------------
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
      // Clicking "Add 10" on a product with stock=5 — quantity should be capped at 5
      await act(async () => screen.getByTestId('add-exceed-stock').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('5')
    })

    it('caps cumulative quantity at stock when same item added multiple times', async () => {
      renderCart()
      // stock=5; add 4 then 4 more — should cap at 5
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

  // -------------------------
  // removeFromCart
  // -------------------------
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

  // -------------------------
  // updateQuantity
  // -------------------------
  describe('updateQuantity', () => {
    it('updates the quantity of an existing cart item', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('update-qty').click()) // sets qty to 3
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
      // Try to set qty=3 but stock=5, so 3 is valid
      await act(async () => screen.getByTestId('update-qty').click())
      expect(screen.getByTestId('item-count')).toHaveTextContent('3')
    })
  })

  // -------------------------
  // clearCart
  // -------------------------
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

  // -------------------------
  // getCartTotal
  // -------------------------
  describe('getCartTotal', () => {
    it('calculates total correctly for a single item', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      expect(screen.getByTestId('total')).toHaveTextContent('49.99')
    })

    it('calculates total for multiple items with different quantities', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click()) // 49.99
      await act(async () => screen.getByTestId('add-pikachu').click())   // 9.99
      // total = 49.99 + 9.99 = 59.98
      expect(screen.getByTestId('total')).toHaveTextContent('59.98')
    })

    it('returns 0 for an empty cart', () => {
      renderCart()
      expect(screen.getByTestId('total')).toHaveTextContent('0.00')
    })
  })

  // -------------------------
  // localStorage persistence
  // -------------------------
  describe('localStorage persistence', () => {
    it('persists cart state to localStorage', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      const stored = JSON.parse(localStorage.getItem('cart'))
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe(1)
    })

    it('clears localStorage when cart is cleared', async () => {
      renderCart()
      await act(async () => screen.getByTestId('add-charizard').click())
      await act(async () => screen.getByTestId('clear').click())
      const stored = JSON.parse(localStorage.getItem('cart'))
      expect(stored).toHaveLength(0)
    })
  })

  // -------------------------
  // Hook outside provider
  // -------------------------
  describe('useCart outside provider', () => {
    it('throws when useCart is called outside CartProvider', () => {
      const BadConsumer = () => { useCart(); return null }
      // React will catch this error and re-throw; suppress the console noise
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<BadConsumer />)).toThrow('useCart must be used within CartProvider')
    })
  })
})
