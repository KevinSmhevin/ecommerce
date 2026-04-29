import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/api/account'
import type { ProfileData, UpdateProfileResponse } from '@/api/account'
import { profileKeys } from './useProfileQuery'
import { authKeys } from './useAuthQuery'

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<UpdateProfileResponse, Error, ProfileData>({
    mutationFn: updateProfile,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
        queryClient.invalidateQueries({ queryKey: authKeys.session() })
      }
    },
  })
}
