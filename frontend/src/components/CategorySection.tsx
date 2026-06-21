import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import { displayCategoryName } from '@/lib/categories'
import type { Category } from '@/types/api'
import ProductCard from './ProductCard'
import { Skeleton } from './ui/skeleton'

export const categorySectionId = (slug: string) => `category-${slug}`

const MAX_PRODUCTS = 12
const SCROLL_STEP_PX = 600

interface CategorySectionProps {
  category: Category
}

const CategorySection = ({ category }: CategorySectionProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const productsQuery = useProductsQuery({ category: category.slug })
  const products = (productsQuery.data?.results ?? []).slice(0, MAX_PRODUCTS)

  const scrollByStep = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' })
  }

  if (!productsQuery.isPending && products.length === 0) return null

  return (
    <section
      id={categorySectionId(category.slug)}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-sm rotate-45 shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          <h2 className="text-white text-base font-black uppercase tracking-widest">{displayCategoryName(category.name)}</h2>
        </div>
        <Link
          to={`/category/${category.slug}`}
          className="flex items-center gap-1 shrink-0 text-white/70 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="group/scroller relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByStep(-1)}
          className="hidden md:flex absolute left-0 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/scroller:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {productsQuery.isPending
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[220px] shrink-0 snap-start">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/3" />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className="w-[220px] shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByStep(1)}
          className="hidden md:flex absolute right-0 top-1/2 z-10 h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/scroller:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}

export default CategorySection
