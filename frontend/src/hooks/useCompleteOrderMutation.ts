import { useMutation } from '@tanstack/react-query'
import { completeOrder } from '@/api/checkout'
import type { CompleteOrderRequest, CompleteOrderResponse } from '@/api/checkout'

export const useCompleteOrderMutation = () =>
  useMutation<CompleteOrderResponse, Error, CompleteOrderRequest>({
    mutationFn: completeOrder,
  })
