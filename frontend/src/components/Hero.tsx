import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import { displayCategoryName, selectFeaturedCategories } from '@/lib/categories'
import { categorySectionId } from './CategorySection'

const scrollToCategory = (slug: string) => {
  document.getElementById(categorySectionId(slug))?.scrollIntoView({ behavior: 'smooth' })
}

const Hero = () => {
  const { data: allCategories = [] } = useCategoriesQuery()
  const categories = selectFeaturedCategories(allCategories)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="glass relative h-[380px] overflow-hidden rounded-3xl !bg-black/40 md:h-[480px]">
        <div
          className="absolute inset-0 hidden bg-gradient-to-br from-red-600 to-red-700 md:block"
          style={{ clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)' }}
        />
        <div
          className="absolute inset-0 hidden opacity-10 md:block"
          style={{
            clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)',
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative flex h-full max-w-full flex-col justify-center px-6 md:max-w-[58%] md:px-16">
          <div className="mb-3 flex items-center gap-2 md:mb-4">
            <div className="h-px w-8 bg-red-500" />
            <p className="text-xs font-black uppercase tracking-widest text-red-500">Premium TCG Store</p>
          </div>
          <h1 className="mb-6 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl md:text-7xl md:leading-[0.9]">
            <span className="block animate-rise-loop [animation-delay:0ms] motion-reduce:animate-none">CATCH</span>
            <span className="block animate-rise-loop text-red-500 [animation-delay:450ms] motion-reduce:animate-none">EVERY</span>
            <span className="block animate-rise-loop [animation-delay:900ms] motion-reduce:animate-none">CARD.</span>
          </h1>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.slug)}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-red-500 hover:text-red-400"
              >
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
