import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import { categoryBannerImage, displayCategoryName } from '@/lib/categories'
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
  const [revealed, setRevealed] = useState(false)
  const productsQuery = useProductsQuery({ category: category.slug })
  const products = (productsQuery.data?.results ?? []).slice(0, MAX_PRODUCTS)
  const name = displayCategoryName(category.name)
  const bannerImage = categoryBannerImage(category.slug)

  const scrollByStep = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' })
  }

  if (!productsQuery.isPending && products.length === 0) return null

  return (
    <section
      id={categorySectionId(category.slug)}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-24"
    >
      <div className="group/scroller relative overflow-hidden rounded-2xl">
        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto p-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

        {revealed && (
          <>
            <button
              type="button"
              aria-label="Show category banner"
              onClick={() => setRevealed(false)}
              className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-red-600"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Banner
            </button>
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollByStep(-1)}
              className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/scroller:opacity-100 md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollByStep(1)}
              className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/scroller:opacity-100 md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div
          className={`absolute inset-0 z-10 transition-transform duration-500 ease-out ${
            revealed ? 'pointer-events-none -translate-x-full' : 'translate-x-0'
          }`}
        >
          {bannerImage ? (
            <img src={bannerImage} alt={name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />

          <button
            type="button"
            onClick={() => setRevealed(true)}
            aria-label={`Show ${name} products`}
            className="absolute inset-0"
          />

          <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end p-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 shrink-0 rotate-45 rounded-sm bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              <h2 className="text-xl font-black uppercase tracking-widest text-white drop-shadow">{name}</h2>
            </div>
            <span className="mt-1 flex items-center gap-1 text-xs font-black uppercase tracking-widest text-white/70">
              Tap to view products <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>

          <Link
            to={`/category/${category.slug}`}
            className="absolute right-5 top-5 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/80 transition-colors hover:border-red-500 hover:text-red-400"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CategorySection
