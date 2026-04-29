import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (!savedCart) return
    try {
      const parsed = JSON.parse(savedCart) as CartItem[]
      if (Array.isArray(parsed)) setCartItems(parsed)
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

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
    }),
    [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
