import { useCart as useUntypedCart } from '@/context/CartContext'
import type { CartContextValue } from '@/types/cart'

export const useCart = (): CartContextValue => useUntypedCart() as CartContextValue
