import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProductBySlugQuery } from '@/hooks/useProductBySlugQuery'
import { useCart } from '@/hooks/useCart'
import PageSpinner from '@/components/PageSpinner'
import type { Product } from '@/types/api'

const collectImages = (product: Product): string[] =>
  [product.image_url, product.image2_url, product.image3_url, product.image4_url]
    .filter((url): url is string => typeof url === 'string' && url.length > 0)

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>()
  const { addToCart, cartItems } = useCart()
  const { data: product, isPending } = useProductBySlugQuery(slug)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  const images = product ? collectImages(product) : []

  useEffect(() => {
    if (images.length <= 1) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length])

  const handleAddToCart = () => {
    if (!product) return
    const existing = cartItems.find((i) => i.id === product.id)
    const currentQty = existing ? existing.quantity : 0
    if (currentQty >= product.stock) {
      setCartMessage(`Maximum quantity (${product.stock}) already in cart`)
      setTimeout(() => setCartMessage(''), 3000)
      return
    }
    addToCart(product, 1)
    setAddedToCart(true)
    setCartMessage('')
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (isPending) return <PageSpinner />

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white border-2 border-black rounded-xl px-12 py-10 text-center" style={{ boxShadow: '4px 4px 0 #000' }}>
          <p className="text-black font-black uppercase tracking-widest text-sm">Product not found.</p>
        </div>
      </div>
    )
  }

  const mainImage = images[selectedIndex] ?? images[0]

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-black/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Gallery */}
            <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-black/10">
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-8 group mb-4">
                {mainImage ? (
                  <>
                    <img
                      key={selectedIndex}
                      src={mainImage}
                      alt={product.title}
                      decoding="async"
                      fetchPriority="high"
                      className="max-w-full max-h-full object-contain transition-all duration-300"
                    />
                    {images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                          className="bg-white border-2 border-black rounded-full p-1.5 hover:bg-black hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                          className="bg-white border-2 border-black rounded-full p-1.5 hover:bg-black hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-300 text-sm font-bold uppercase tracking-widest">No Image</span>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedIndex === i ? 'border-black scale-105' : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <img src={img} alt={`View ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 lg:p-8 flex flex-col">
              {product.category && (
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl font-black text-black uppercase tracking-wide leading-tight mb-4">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                <span className="text-3xl font-black text-black">${product.price}</span>
              </div>

              {product.description && (
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between py-3 border-t border-b border-black/10 mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Stock</span>
                <span className={`text-xs font-black uppercase tracking-widest ${product.stock > 0 ? 'text-black' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
                </span>
              </div>

              {cartMessage && (
                <div className="mb-4 px-4 py-2.5 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                  {cartMessage}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-colors ${
                  product.stock === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                    : addedToCart
                    ? 'bg-black text-white'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {addedToCart ? '✓ Added to Cart' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
