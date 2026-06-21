import { useEffect, useState } from 'react'
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import { categorySectionId } from './CategorySection'

const CATEGORY_IMAGES: Record<string, string> = {
  'graded-pokemon-english': '/banners/mini/graded-pokemon-english.png',
  'graded-pokemon-japanese': '/banners/mini/graded-pokemon-japanese.png',
  'graded-one-piece': '/banners/mini/graded-one-piece.png',
}

const ROTATION_MS = 4000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scrollToCategory = (slug: string) => {
  document.getElementById(categorySectionId(slug))?.scrollIntoView({ behavior: 'smooth' })
}

const Hero = () => {
  const { data: categories = [] } = useCategoriesQuery()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || categories.length <= 1 || prefersReducedMotion()) return
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % categories.length)
    }, ROTATION_MS)
    return () => window.clearInterval(timer)
  }, [paused, categories.length])

  useEffect(() => {
    if (categories.length > 0 && activeIndex >= categories.length) setActiveIndex(0)
  }, [categories.length, activeIndex])

  return (
    <section className="relative w-full overflow-hidden">
      <div className="glass relative h-[480px] overflow-hidden !rounded-none !border-x-0 !bg-black/40 md:h-[540px]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700"
          style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 30% 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 30% 100%)',
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="mb-3 flex items-center gap-2 md:mb-4">
                <div className="h-px w-8 bg-red-500" />
                <p className="text-xs font-black uppercase tracking-widest text-red-500">Premium TCG Store</p>
              </div>
              <h1 className="mb-6 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl md:text-7xl md:leading-[0.9]">
                CATCH<br />
                <span className="text-red-500">EVERY</span><br />
                CARD.
              </h1>
              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={index === activeIndex}
                    onMouseEnter={() => {
                      setActiveIndex(index)
                      setPaused(true)
                    }}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => {
                      setActiveIndex(index)
                      setPaused(true)
                    }}
                    onBlur={() => setPaused(false)}
                    onClick={() => scrollToCategory(category.slug)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                      index === activeIndex
                        ? 'border-white bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.25)]'
                        : 'border-white/20 bg-white/5 text-white hover:border-red-500 hover:text-red-400'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative hidden h-[380px] md:block">
              {categories.map((category, index) => {
                const image = CATEGORY_IMAGES[category.slug]
                const isActive = index === activeIndex
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-hidden={!isActive}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`View ${category.name}`}
                    onClick={() => scrollToCategory(category.slug)}
                    className={`absolute inset-0 overflow-hidden rounded-2xl border border-white/15 transition-opacity duration-700 ${
                      isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    {image ? (
                      <img src={image} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-red-600 to-red-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 text-sm font-black uppercase tracking-widest text-white drop-shadow">
                      {category.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
