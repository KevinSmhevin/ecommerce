import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import { displayCategoryName, selectFeaturedCategories } from '@/lib/categories'
import { categorySectionId } from './CategorySection'

const scrollToCategory = (slug: string) => {
  document.getElementById(categorySectionId(slug))?.scrollIntoView({ behavior: 'smooth' })
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

        <div className="pointer-events-none absolute right-8 top-8 hidden h-10 w-10 md:block">
          <div className="absolute inset-0 rounded-full border border-red-500/40" />
          <div className="absolute left-1/2 top-1 h-2 w-px -translate-x-1/2 bg-red-500/60" />
          <div className="absolute bottom-1 left-1/2 h-2 w-px -translate-x-1/2 bg-red-500/60" />
          <div className="absolute left-1 top-1/2 h-px w-2 -translate-y-1/2 bg-red-500/60" />
          <div className="absolute right-1 top-1/2 h-px w-2 -translate-y-1/2 bg-red-500/60" />
        </div>

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
