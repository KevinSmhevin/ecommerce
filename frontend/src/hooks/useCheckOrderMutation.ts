import { useMutation } from '@tanstack/react-query'
import { checkOrder } from '@/api/account'
import type { CheckOrderRequest, CheckOrderResponse } from '@/api/account'

export const useCheckOrderMutation = () =>
  useMutation<CheckOrderResponse, Error, CheckOrderRequest>({
    mutationFn: checkOrder,
  })
