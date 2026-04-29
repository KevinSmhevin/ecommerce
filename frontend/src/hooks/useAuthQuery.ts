import { useQuery } from '@tanstack/react-query'
import { checkAuth } from '@/api/auth'

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

export const useAuthQuery = () =>
  useQuery({
    queryKey: authKeys.session(),
    queryFn: checkAuth,
    staleTime: 5 * 60_000,
  })
