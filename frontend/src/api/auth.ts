import axios from '@/config/axios'

export interface AuthUser {
  username: string
  email: string
}

export interface CheckAuthResponse {
  authenticated: boolean
  user?: AuthUser
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password1: string
  password2: string
}

export type FieldErrors = Record<string, string[] | string | undefined>

export interface AuthMutationSuccess {
  success: true
  message?: string
  user?: AuthUser
}

export interface AuthMutationFailure {
  success: false
  message: string
  errors?: FieldErrors
}

export type AuthMutationResult = AuthMutationSuccess | AuthMutationFailure

const errorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? fallback
  }
  return fallback
}

const errorFields = (error: unknown): FieldErrors | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.errors
  }
  return undefined
}

export const checkAuth = async (): Promise<AuthUser | null> => {
  const { data } = await axios.get<CheckAuthResponse>('/account/api/check-auth')
  return data.authenticated && data.user ? data.user : null
}

export const loginRequest = async (payload: LoginPayload): Promise<AuthMutationResult> => {
  try {
    const { data } = await axios.post<{ success: boolean; message?: string; user?: AuthUser }>(
      '/account/api/login',
      payload,
    )
    if (data.success && data.user) {
      return { success: true, message: data.message, user: data.user }
    }
    return { success: false, message: data.message ?? 'Login failed' }
  } catch (error) {
    return { success: false, message: errorMessage(error, 'Login failed') }
  }
}

export const registerRequest = async (
  payload: RegisterPayload,
): Promise<AuthMutationResult> => {
  try {
    const { data } = await axios.post<{ success: boolean; message?: string }>(
      '/account/api/register',
      payload,
    )
    if (data.success) {
      return { success: true, message: data.message }
    }
    return { success: false, message: data.message ?? 'Registration failed' }
  } catch (error) {
    return {
      success: false,
      message: errorMessage(error, 'Registration failed'),
      errors: errorFields(error),
    }
  }
}

export const logoutRequest = async (): Promise<void> => {
  await axios.post('/account/api/logout', {})
}
