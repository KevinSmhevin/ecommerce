import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductBySlug } from '@/api/products'
import { productsKeys } from './useProductsQuery'
import type { Paginated, Product } from '@/types/api'

// Walk every cached `products list` query and find the freshest row whose
// slug matches. Lets the detail page render instantly when navigating from
// the home/category grid instead of waiting on a redundant round-trip.
const findInListCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  slug: string,
): { product: Product; updatedAt: number } | null => {
  const entries = queryClient.getQueriesData<Paginated<Product>>({
    queryKey: [...productsKeys.all, 'list'],
  })
  let best: { product: Product; updatedAt: number } | null = null
  for (const [key, data] of entries) {
    if (!data || !Array.isArray(data.results)) continue
    const hit = data.results.find((p) => p.slug === slug)
    if (!hit) continue
    const updatedAt = queryClient.getQueryState(key)?.dataUpdatedAt ?? 0
    if (!best || updatedAt > best.updatedAt) best = { product: hit, updatedAt }
  }
  return best
}

export const useProductBySlugQuery = (slug: string | undefined) => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: productsKeys.bySlug(slug ?? ''),
    queryFn: () => fetchProductBySlug(slug as string),
    enabled: Boolean(slug),
    initialData: () => (slug ? findInListCache(queryClient, slug)?.product : undefined),
    initialDataUpdatedAt: () =>
      slug ? findInListCache(queryClient, slug)?.updatedAt : undefined,
  })
}
