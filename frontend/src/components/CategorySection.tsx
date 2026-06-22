import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import { categoryBannerImage, displayCategoryName } from '@/lib/categories'
import type { Category } from '@/types/api'
import SlabCard from './SlabCard'
import { Skeleton } from './ui/skeleton'

export const categorySectionId = (slug: string) => `category-${slug}`

const MAX_PRODUCTS = 12
const SCROLL_STEP_PX = 640
const AUTO_SCROLL_PX_PER_SEC = 14

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface CategorySectionProps {
  category: Category
}

const CategorySection = ({ category }: CategorySectionProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const productsQuery = useProductsQuery({ category: category.slug })
  const products = (productsQuery.data?.results ?? []).slice(0, MAX_PRODUCTS)
  const name = displayCategoryName(category.name)
  const bannerImage = categoryBannerImage(category.slug)
  const slabCount = productsQuery.data?.count ?? 0

  const scrollByStep = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || products.length === 0 || prefersReducedMotion()) return

    // Track the position as a float so sub-pixel-per-frame increments aren't
    // lost to scrollLeft's integer rounding; re-sync it after manual scroll.
    let position = el.scrollLeft
    let paused = false
    const pause = () => { paused = true }
    const resume = () => {
      position = el.scrollLeft
      paused = false
    }
    el.addEventListener('pointerenter', pause)
    el.addEventListener('pointerleave', resume)
    el.addEventListener('pointerdown', pause)
    el.addEventListener('focusin', pause)

    let raf = 0
    let last = performance.now()
    let direction: 1 | -1 = 1
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const max = el.scrollWidth - el.clientWidth
      if (!paused && max > 1) {
        position += direction * AUTO_SCROLL_PX_PER_SEC * dt
        if (position >= max) {
          position = max
          direction = -1
        } else if (position <= 0) {
          position = 0
          direction = 1
        }
        el.scrollLeft = position
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', pause)
      el.removeEventListener('pointerleave', resume)
      el.removeEventListener('pointerdown', pause)
      el.removeEventListener('focusin', pause)
    }
  }, [products.length])

  if (!productsQuery.isPending && products.length === 0) return null

  return (
    <section
      id={categorySectionId(category.slug)}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 scroll-mt-24"
    >
      <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10">
        {bannerImage && (
          <>
            <img src={bannerImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
          </>
        )}
        <div className="relative flex min-h-[120px] items-end justify-between gap-4 p-5 md:min-h-[135px]">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-500">Graded · Authenticated</span>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow md:text-3xl">{name}</h2>
              {slabCount > 0 && <span className="font-mono text-xs font-bold text-white/45">{slabCount} slabs</span>}
            </div>
          </div>
          <Link
            to={`/category/${category.slug}`}
            className="flex shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:border-red-500 hover:text-red-400"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="relative h-px w-full bg-gradient-to-r from-red-600/80 via-red-600/20 to-transparent" />
      </div>

      <div className="group/rail relative">
        <div className="overflow-hidden rounded-2xl border border-red-500/40 bg-black/65 px-5 py-2 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.75),0_0_22px_-4px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {productsQuery.isPending
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[230px] shrink-0">
                    <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/3" />
                  </div>
                ))
              : products.map((product) => <SlabCard key={product.id} product={product} />)}
          </div>
        </div>

        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByStep(-1)}
          className="absolute left-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover/rail:opacity-100 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByStep(1)}
          className="absolute right-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover/rail:opacity-100 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}

export default CategorySection
