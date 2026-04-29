import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginRequest } from '@/api/auth'
import type { AuthMutationResult, LoginPayload } from '@/api/auth'
import { authKeys } from './useAuthQuery'

export const useLoginMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<AuthMutationResult, Error, LoginPayload>({
    mutationFn: loginRequest,
    onSuccess: (result) => {
      if (result.success && result.user) {
        queryClient.setQueryData(authKeys.session(), result.user)
      }
    },
  })
}
