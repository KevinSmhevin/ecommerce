import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutRequest } from '@/api/auth'
import { authKeys } from './useAuthQuery'

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: logoutRequest,
    onSettled: () => {
      queryClient.setQueryData(authKeys.session(), null)
      queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}
