import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import { displayCategoryName, selectFeaturedCategories } from '@/lib/categories'
import type { Product } from '@/types/api'
import { categorySectionId } from './CategorySection'

const ROTATE_MS = 15000
const FADE_MS = 450

const scrollToCategory = (slug: string) => {
  document.getElementById(categorySectionId(slug))?.scrollIntoView({ behavior: 'smooth' })
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const shuffle = (items: Product[]): Product[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const GRID_BG = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
}

const RED_GLOW = { background: 'radial-gradient(70% 90% at 88% 60%, rgba(220,38,38,0.30), transparent 70%)' }

const Hero = () => {
  const { data: allCategories = [] } = useCategoriesQuery()
  const categories = selectFeaturedCategories(allCategories)

  const { data: productsPage } = useProductsQuery({})
  const featured = useMemo(() => shuffle(productsPage?.results ?? []), [productsPage])

  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (featured.length <= 1 || prefersReducedMotion()) return
    let swapTimer = 0
    const rotate = window.setInterval(() => {
      setVisible(false)
      swapTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % featured.length)
        setVisible(true)
      }, FADE_MS)
    }, ROTATE_MS)
    return () => {
      window.clearInterval(rotate)
      window.clearTimeout(swapTimer)
    }
  }, [featured.length])

  const active = featured.length ? featured[index % featured.length] : undefined

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="relative h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl md:h-[480px]">
        <div className="absolute inset-0 opacity-[0.10]" style={GRID_BG} />
        <div className="absolute inset-0" style={RED_GLOW} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <span className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-red-500/70" />
        <span className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-red-500/70" />
        <span className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-red-500/70" />
        <span className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-red-500/70" />

        <div className="pointer-events-none absolute left-0 right-0 h-px animate-hud-scan bg-gradient-to-r from-transparent via-red-500/80 to-transparent shadow-[0_0_12px_rgba(220,38,38,0.8)] motion-reduce:hidden" />

        {active && (
          <Link
            to={`/product/${active.slug}`}
            aria-label={`Featured: ${active.title}`}
            className="group absolute right-[12%] top-1/2 z-10 hidden w-[230px] -translate-y-1/2 lg:block"
          >
            <div
              className={`glass overflow-hidden rounded-2xl border border-white/15 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.7),0_0_24px_-6px_rgba(220,38,38,0.4)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-red-500/50 ${
                visible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-red-400 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
                  Featured
                </span>
                {active.image_url ? (
                  <img
                    src={active.image_url}
                    alt={active.title}
                    className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-white/30">
                    No Image
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-white/5 p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{active.title}</p>
                  <p className="font-mono text-sm font-black text-white">${active.price}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] font-black uppercase tracking-widest text-red-400 transition-colors group-hover:text-red-300">
                  View →
                </span>
              </div>
            </div>
          </Link>
        )}

        <div className="relative flex h-full max-w-full flex-col justify-center px-6 md:max-w-[62%] md:px-14">
          <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Premium TCG Store · Live
          </div>

          <h1 className="mb-6 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl md:text-7xl md:leading-[0.9]">
            <span className="block animate-rise-loop [animation-delay:0ms] motion-reduce:animate-none">CATCH</span>
            <span className="block animate-rise-loop glow-red text-red-500 [animation-delay:450ms] motion-reduce:animate-none">EVERY</span>
            <span className="block animate-rise-loop [animation-delay:900ms] motion-reduce:animate-none">CARD.</span>
          </h1>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.slug)}
                className="flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
              >
                <span aria-hidden className="text-red-500">▸</span>
                {displayCategoryName(category.name)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
