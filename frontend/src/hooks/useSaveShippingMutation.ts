import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveShipping } from '@/api/shipping'
import type { SaveShippingResponse, ShippingAddress } from '@/api/shipping'
import { shippingKeys } from './useShippingQuery'

export const useSaveShippingMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<SaveShippingResponse, Error, ShippingAddress>({
    mutationFn: saveShipping,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: shippingKeys.saved() })
      }
    },
  })
}
