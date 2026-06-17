import type { MouseEvent } from 'react'
import { ChevronRight } from 'lucide-react'

const handleShopNowClick = (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault()
  document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })
}

const Hero = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
    <div className="glass relative h-[380px] md:h-[480px] overflow-hidden rounded-3xl !bg-black/40">
      <div
        className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 hidden md:block"
        style={{ clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 28% 100%)' }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 md:hidden"
        style={{ clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 48% 100%)' }}
      />
      <div
        className="absolute inset-0 opacity-10 hidden md:block"
        style={{
          clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 28% 100%)',
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div
        className="absolute inset-0 opacity-10 md:hidden"
        style={{
          clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 48% 100%)',
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative h-full flex flex-col justify-center px-6 md:px-16 max-w-[58%] md:max-w-[58%]">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <div className="h-px w-8 bg-red-500" />
          <p className="text-red-500 text-xs font-black uppercase tracking-widest">Premium TCG Store</p>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-7xl font-black text-white uppercase leading-none md:leading-[0.9] mb-5 md:mb-6 tracking-tight">
          CATCH<br />
          <span className="text-red-500">EVERY</span><br />
          CARD.
        </h1>
        <a
          href="#products"
          onClick={handleShopNowClick}
          className="inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-4 bg-white text-black font-black uppercase tracking-widest text-xs md:text-sm hover:bg-red-600 hover:text-white transition-all self-start rounded-xl border border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:shadow-[0_0_28px_rgba(220,38,38,0.6)]"
        >
          SHOP NOW <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 text-xs font-black uppercase tracking-[0.35em] rotate-90 select-none whitespace-nowrap hidden md:block">
        Pokémon · One Piece · Graded
      </div>
    </div>
  </div>
)

export default Hero
