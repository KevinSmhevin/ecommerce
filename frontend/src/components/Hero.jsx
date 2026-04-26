import { ChevronRight } from 'lucide-react'

const Hero = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
    <div
      className="relative h-[380px] md:h-[480px] bg-black overflow-hidden rounded-2xl"
      style={{ border: '4px solid #000', boxShadow: '8px 8px 0 #DC2626' }}
    >
      <div
        className="absolute inset-0 bg-red-600"
        style={{ clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 28% 100%)' }}
      />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 28% 100%)',
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative h-full flex flex-col justify-center px-10 md:px-16 max-w-[58%]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px w-8 bg-red-500" />
          <p className="text-red-500 text-xs font-black uppercase tracking-widest">Premium TCG Store</p>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-[0.9] mb-6 tracking-tight">
          CATCH<br />
          <span className="text-red-500">EVERY</span><br />
          CARD.
        </h1>
        <a
          href="#products"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-colors self-start rounded-xl"
          style={{ border: '3px solid #fff', boxShadow: '4px 4px 0 #DC2626' }}
        >
          SHOP NOW <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 text-xs font-black uppercase tracking-[0.35em] rotate-90 select-none whitespace-nowrap">
        Pokémon · One Piece · Graded
      </div>
    </div>
  </div>
)

export default Hero
