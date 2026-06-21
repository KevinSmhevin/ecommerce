import type { Category } from '@/types/api'

export const FEATURED_CATEGORY_SLUGS = [
  'graded-pokemon-english',
  'graded-pokemon-japanese',
  'graded-one-piece',
] as const

export const selectFeaturedCategories = (categories: Category[]): Category[] =>
  FEATURED_CATEGORY_SLUGS.map((slug) => categories.find((category) => category.slug === slug)).filter(
    (category): category is Category => category !== undefined,
  )

export const displayCategoryName = (name: string): string => name.replace(/^graded\s+/i, '')
