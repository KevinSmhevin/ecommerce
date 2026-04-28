import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/api/categories'

export const categoriesKeys = {
  all: ['categories'] as const,
  list: () => [...categoriesKeys.all, 'list'] as const,
  bySlug: (slug: string) => [...categoriesKeys.all, 'detail', slug] as const,
}

export const useCategoriesQuery = () =>
  useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: fetchCategories,
  })
