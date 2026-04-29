import axios from '@/config/axios'
import type { Order } from '@/types/api'
import type { FieldErrors } from './auth'

export interface DashboardData {
  orders_count: number
  [key: string]: unknown
}

export interface ProfileData {
  username: string
  email: string
}

export interface UpdateProfileResponse {
  success: boolean
  message?: string
  error?: string
  errors?: FieldErrors
}

export interface CheckOrderRequest {
  order_number: string
  email: string
}

export interface CheckOrderResponse {
  success: boolean
  order?: Order
  error?: string
}

export const fetchDashboard = async (): Promise<DashboardData> => {
  const { data } = await axios.get<DashboardData>('/account/api/dashboard')
  return data
}

export const fetchProfile = async (): Promise<ProfileData> => {
  const { data } = await axios.get<ProfileData>('/account/api/profile-management')
  return data
}

export const updateProfile = async (payload: ProfileData): Promise<UpdateProfileResponse> => {
  const { data } = await axios.post<UpdateProfileResponse>(
    '/account/api/profile-management',
    payload,
  )
  return data
}

export const fetchOrders = async (): Promise<Order[]> => {
  const { data } = await axios.get<{ orders?: Order[] }>('/account/api/track-orders')
  return data.orders ?? []
}

export const checkOrder = async (payload: CheckOrderRequest): Promise<CheckOrderResponse> => {
  const { data } = await axios.post<CheckOrderResponse>('/account/api/check-order', payload)
  return data
}
