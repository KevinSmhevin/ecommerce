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

const CATEGORY_BANNER_IMAGES: Record<string, string> = {
  'graded-pokemon-english': '/banners/mini/graded-pokemon-english.png',
  'graded-pokemon-japanese': '/banners/mini/graded-pokemon-japanese.png',
  'graded-one-piece': '/banners/mini/graded-one-piece.png',
}

export const categoryBannerImage = (slug: string): string | undefined => CATEGORY_BANNER_IMAGES[slug]
