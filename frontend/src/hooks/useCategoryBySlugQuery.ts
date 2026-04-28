import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/api/categories'
import { categoriesKeys } from './useCategoriesQuery'

export const useCategoryBySlugQuery = (slug: string | undefined) =>
  useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: fetchCategories,
    enabled: Boolean(slug),
    select: (categories) => categories.find((c) => c.slug === slug) ?? null,
  })
