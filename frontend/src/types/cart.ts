import type { Product } from './api'

export interface CartItem extends Product {
  quantity: number
}

export interface CartContextValue {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
  removedItems: string[]
  dismissRemovedNotice: () => void
}
