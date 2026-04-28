import axios from '@/config/axios'
import type { Category, Paginated } from '@/types/api'

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get<Paginated<Category> | Category[]>('/api/categories/')
  if (Array.isArray(data)) return data
  return data.results
}
