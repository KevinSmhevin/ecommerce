import { useQuery } from '@tanstack/react-query'
import { fetchShipping } from '@/api/shipping'

export const shippingKeys = {
  all: ['shipping'] as const,
  saved: () => [...shippingKeys.all, 'saved'] as const,
}

export const useShippingQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: shippingKeys.saved(),
    queryFn: fetchShipping,
    enabled,
  })
