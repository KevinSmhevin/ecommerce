import axios from '@/config/axios'

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

export const fetchShipping = async (): Promise<ShippingAddressPartial> => {
  const { data } = await axios.get<ShippingAddressPartial>('/account/api/manage-shipping')
  return data ?? {}
}
