import { useMutation } from '@tanstack/react-query'
import { registerRequest } from '@/api/auth'
import type { AuthMutationResult, RegisterPayload } from '@/api/auth'

export const useRegisterMutation = () =>
  useMutation<AuthMutationResult, Error, RegisterPayload>({
    mutationFn: registerRequest,
  })
