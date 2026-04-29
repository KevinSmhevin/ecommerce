import axios from '@/config/axios'
import type { CartItem } from '@/types/cart'
import type { ShippingAddress } from './shipping'
import type { FieldErrors } from './auth'

export interface CompleteOrderRequest {
  cart_items: CartItem[]
  shipping: ShippingAddress
}

export interface CompleteOrderResponse {
  success: boolean
  order_id?: string | number
  error?: string
  errors?: FieldErrors
}

export const completeOrder = async (
  payload: CompleteOrderRequest,
): Promise<CompleteOrderResponse> => {
  const { data } = await axios.post<CompleteOrderResponse>(
    '/payment/api/complete-order',
    payload,
  )
  return data
}
