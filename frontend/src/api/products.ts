import axios from '@/config/axios'
import type { Paginated, Product, ProductsQueryParams } from '@/types/api'

export const fetchProducts = async (
  params: ProductsQueryParams = {},
): Promise<Paginated<Product>> => {
  const { data } = await axios.get<Paginated<Product> | Product[]>('/api/products/', {
    params,
  })
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data }
  }
  return data
}

export const fetchProductBySlug = async (slug: string): Promise<Product> => {
  const { data } = await axios.get<Product>(`/api/products/${slug}/`)
  return data
}
