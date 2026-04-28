import { useQuery } from '@tanstack/react-query'
import { fetchProductBySlug } from '@/api/products'
import { productsKeys } from './useProductsQuery'

export const useProductBySlugQuery = (slug: string | undefined) =>
  useQuery({
    queryKey: productsKeys.bySlug(slug ?? ''),
    queryFn: () => fetchProductBySlug(slug as string),
    enabled: Boolean(slug),
  })
