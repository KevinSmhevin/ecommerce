import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/api/account'

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
}

export const useProfileQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchProfile,
    enabled,
  })
