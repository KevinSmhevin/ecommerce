import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'
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
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const images = product ? collectImages(product) : []

  const showPrevImage = () => setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1))
  const showNextImage = () => setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0))

  useEffect(() => {
    if (images.length <= 1) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrevImage()
      if (e.key === 'ArrowRight') showNextImage()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

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
        <div className="glass rounded-2xl px-12 py-10 text-center">
          <p className="text-white font-black uppercase tracking-widest text-sm">Product not found.</p>
        </div>
      </div>
    )
  }

  const mainImage = images[selectedIndex] ?? images[0]

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Gallery */}
            <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="relative aspect-square bg-black/30 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center p-8 group mb-4">
                {mainImage ? (
                  <>
                    <img
                      key={selectedIndex}
                      src={mainImage}
                      alt={product.title}
                      decoding="async"
                      fetchPriority="high"
                      onClick={() => setLightboxOpen(true)}
                      className="max-w-full max-h-full object-contain transition-all duration-300 cursor-zoom-in"
                    />
                    <button
                      type="button"
                      aria-label="Expand image"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute top-3 right-3 glass glass-hover text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    {images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <button
                          onClick={showPrevImage}
                          aria-label="Previous image"
                          className="glass glass-hover text-white rounded-full p-1.5 transition-colors pointer-events-auto"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={showNextImage}
                          aria-label="Next image"
                          className="glass glass-hover text-white rounded-full p-1.5 transition-colors pointer-events-auto"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-white/30 text-sm font-bold uppercase tracking-widest">No Image</span>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                        selectedIndex === i ? 'border-red-500 scale-105' : 'border-white/10 hover:border-white/30'
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
                <span className="text-xs font-black uppercase tracking-widest text-white/50 mb-3">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl font-black text-white uppercase tracking-wide leading-tight mb-4">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
                <span className="text-3xl font-black text-white">${product.price}</span>
              </div>

              {product.description && (
                <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between py-3 border-t border-b border-white/10 mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-white/50">Stock</span>
                <span className={`text-xs font-black uppercase tracking-widest ${product.stock > 0 ? 'text-white' : 'text-red-500'}`}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
                </span>
              </div>

              {cartMessage && (
                <div className="mb-4 px-4 py-2.5 bg-amber-500/10 border border-amber-400/30 text-amber-300 backdrop-blur-md rounded-xl text-xs font-bold uppercase tracking-wider">
                  {cartMessage}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-colors ${
                  product.stock === 0
                    ? 'glass text-white/30 cursor-not-allowed'
                    : addedToCart
                    ? 'glass glass-hover text-white'
                    : 'bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700'
                }`}
              >
                {addedToCart ? '✓ Added to Cart' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && mainImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-10"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} enlarged image`}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 glass glass-hover text-white rounded-full p-2.5 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            src={mainImage}
            alt={product.title}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain select-none drop-shadow-2xl"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); showPrevImage() }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 glass glass-hover text-white rounded-full p-3"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); showNextImage() }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 glass glass-hover text-white rounded-full p-3"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                {selectedIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductDetail
