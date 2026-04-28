import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchProducts } from '@/api/products'
import type { ProductsQueryParams } from '@/types/api'

export const productsKeys = {
  all: ['products'] as const,
  list: (params: ProductsQueryParams) => [...productsKeys.all, 'list', params] as const,
  bySlug: (slug: string) => [...productsKeys.all, 'detail', slug] as const,
}

export const useProductsQuery = (params: ProductsQueryParams) =>
  useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
  })
