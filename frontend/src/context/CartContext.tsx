import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import axios from '@/config/axios'
import { fetchProductBySlug } from '@/api/products'
import type { Product } from '@/types/api'
import type { CartContextValue, CartItem } from '@/types/cart'

const CartContext = createContext<CartContextValue | null>(null)

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

const hydrateFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  const saved = window.localStorage.getItem('cart')
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    return []
  }
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(hydrateFromStorage)
  const [removedItems, setRemovedItems] = useState<string[]>([])
  const reconciledRef = useRef(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Reconcile against the live catalog on mount: drop deleted/sold-out items,
  // refresh price/stock on survivors, cap quantity to current stock. Network
  // errors other than 404 leave items untouched so a flaky connection never
  // empties a real cart.
  useEffect(() => {
    if (reconciledRef.current) return
    reconciledRef.current = true

    const itemsAtMount = cartItems
    if (itemsAtMount.length === 0) return

    let cancelled = false

    void (async () => {
      const results = await Promise.allSettled(
        itemsAtMount.map((item) => fetchProductBySlug(item.slug)),
      )
      if (cancelled) return

      const updates = new Map<string, Product | null>()
      const dropped: string[] = []

      itemsAtMount.forEach((item, idx) => {
        const result = results[idx]
        if (result.status === 'rejected') {
          if (axios.isAxiosError(result.reason) && result.reason.response?.status === 404) {
            updates.set(item.slug, null)
            dropped.push(item.slug)
          }
          return
        }
        const fresh = result.value
        if (!fresh.stock || fresh.stock <= 0) {
          updates.set(item.slug, null)
          dropped.push(item.slug)
        } else {
          updates.set(item.slug, fresh)
        }
      })

      if (updates.size === 0) return

      setCartItems((prev) =>
        prev
          .map((item) => {
            if (!updates.has(item.slug)) return item
            const fresh = updates.get(item.slug)
            if (fresh === null || fresh === undefined) return null
            return { ...fresh, quantity: Math.min(item.quantity, fresh.stock) }
          })
          .filter((item): item is CartItem => item !== null),
      )
      if (dropped.length > 0) setRemovedItems(dropped)
    })()

    return () => {
      cancelled = true
    }
    // Intentional one-shot reconciliation against the cart as it was at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const availableStock = product.stock || 0
      const existingItem = prevItems.find((item) => item.id === product.id)

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        const cappedQuantity = Math.min(newQuantity, availableStock)
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: cappedQuantity } : item,
        )
      }

      const finalQuantity = Math.min(quantity, availableStock)
      if (finalQuantity <= 0) return prevItems

      return [...prevItems, { ...product, quantity: finalQuantity }]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== productId) return item
        const availableStock = item.stock || 0
        return { ...item, quantity: Math.min(quantity, availableStock) }
      }),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const dismissRemovedNotice = useCallback(() => {
    setRemovedItems([])
  }, [])

  const getCartTotal = useCallback(
    () => cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0),
    [cartItems],
  )

  const getCartItemCount = useCallback(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      removedItems,
      dismissRemovedNotice,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      removedItems,
      dismissRemovedNotice,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
