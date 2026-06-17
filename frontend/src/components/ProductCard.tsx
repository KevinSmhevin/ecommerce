import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Product } from '@/types/api'

interface ProductCardProps {
  product: Pick<Product, 'slug' | 'title' | 'price' | 'image_url'>
}

const ProductCard = ({ product }: ProductCardProps) => (
  <Link
    to={`/product/${product.slug}`}
    className="group glass glass-hover relative flex flex-col rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:!border-red-500/40"
  >
    <div className="relative aspect-square m-2 mb-0 rounded-xl overflow-hidden bg-black/30 border border-white/5">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.18),transparent_70%)]" />
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="relative w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-white/30 text-xs uppercase tracking-widest font-bold">
          No Image
        </span>
      )}
    </div>
    <div className="flex flex-col flex-1 p-4 gap-3">
      <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 flex-1 transition-colors group-hover:text-red-400">
        {product.title}
      </h3>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
        <span className="text-white font-black text-base tracking-tight">${product.price}</span>
      </div>
    </div>
    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-[0_0_14px_rgba(220,38,38,0.6)]">
      View <ArrowUpRight className="w-3 h-3" />
    </div>
  </Link>
)

export default ProductCard
