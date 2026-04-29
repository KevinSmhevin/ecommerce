import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '@/api/account'

export const ordersKeys = {
  all: ['orders'] as const,
  list: () => [...ordersKeys.all, 'list'] as const,
}

export const useOrdersQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ordersKeys.list(),
    queryFn: fetchOrders,
    enabled,
  })
