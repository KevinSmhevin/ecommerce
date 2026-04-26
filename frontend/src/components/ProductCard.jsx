import { Link } from 'react-router-dom'

const ProductCard = ({ product }) => (
  <Link
    to={`/product/${product.slug}`}
    className="group flex flex-col bg-white border border-black/20 rounded-2xl overflow-hidden transition-all duration-200 hover:border-black hover:shadow-lg"
  >
    <div className="aspect-square bg-gray-50 overflow-hidden flex items-center justify-center p-4 rounded-xl m-2 mb-0">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="text-gray-300 text-xs uppercase tracking-widest font-bold">No Image</span>
      )}
    </div>
    <div className="flex flex-col flex-1 p-4 gap-2">
      <h3 className="text-black font-bold text-sm leading-snug line-clamp-2 flex-1">
        {product.title}
      </h3>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-600 rounded-full shrink-0" />
        <span className="text-black font-black text-sm">${product.price}</span>
      </div>
    </div>
  </Link>
)

export default ProductCard
