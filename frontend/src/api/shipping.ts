import axios from '@/config/axios'
import type { FieldErrors } from './auth'

export interface ShippingAddress {
  full_name: string
  email: string
  address1: string
  address2: string
  city: string
  state: string
  zipcode: string
}

export type ShippingAddressPartial = Partial<ShippingAddress>

export interface SaveShippingResponse {
  success: boolean
  message?: string
  error?: string
  errors?: FieldErrors
}

export const fetchShipping = async (): Promise<ShippingAddressPartial> => {
  const { data } = await axios.get<ShippingAddressPartial>('/account/api/manage-shipping')
  return data ?? {}
}

export const saveShipping = async (
  payload: ShippingAddress,
): Promise<SaveShippingResponse> => {
  const { data } = await axios.post<SaveShippingResponse>(
    '/account/api/manage-shipping',
    payload,
  )
  return data
}
