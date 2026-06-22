import { Link } from 'react-router-dom'
import type { Product } from '@/types/api'

interface SlabCardProps {
  product: Pick<Product, 'slug' | 'title' | 'price' | 'image_url' | 'brand'>
}

const SlabCard = ({ product }: SlabCardProps) => (
  <Link
    to={`/product/${product.slug}`}
    className="glass group relative flex w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/40 hover:shadow-[0_18px_50px_-12px_rgba(220,38,38,0.55)]"
  >
    <div className="relative m-2.5 mb-0 aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          backgroundImage:
            'linear-gradient(115deg, rgba(56,189,248,0.18), rgba(217,70,239,0.14), rgba(250,204,21,0.18))',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-20 -translate-x-full bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100 motion-reduce:hidden" />
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="relative h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-white/30">
          No Image
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col gap-2 p-3.5">
      {product.brand ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{product.brand}</span>
      ) : null}
      <h3 className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-white transition-colors group-hover:text-red-400">
        {product.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="font-mono text-base font-black tracking-tight text-white">${product.price}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </div>
    </div>
  </Link>
)

export default SlabCard
