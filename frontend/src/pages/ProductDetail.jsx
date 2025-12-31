import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from '../config/axios'
import { useCart } from '../context/CartContext'

const ProductDetail = () => {
  const { slug } = useParams()
  const { addToCart, cartItems } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    fetchProduct()
  }, [slug])

  // Get images array
  const images = product ? [
    product.image_url,
    product.image2_url,
    product.image3_url,
    product.image4_url,
  ].filter(Boolean) : []

  // Keyboard navigation for images
  useEffect(() => {
    if (images.length <= 1) return

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [images.length])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/products/${slug}/`)
      setProduct(response.data)
      if (response.data?.image_url) {
        setSelectedImageIndex(0)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600 text-lg">Product not found.</p>
        </div>
      </div>
    )
  }

  const mainImage = images[selectedImageIndex] || images[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery Section */}
            <div>
              {/* Main Image Display */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-6 flex items-center justify-center p-8 border-2 border-gray-200 shadow-sm relative group">
                {mainImage ? (
                  <>
                    <img
                      src={mainImage}
                      alt={product.title}
                      className="max-w-full max-h-full object-contain transition-all duration-300 ease-in-out"
                      key={selectedImageIndex}
                    />
                    {images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                          className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg border-2 border-gray-200 hover:border-primary-red transition-colors"
                          aria-label="Previous image"
                        >
                          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                          className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg border-2 border-gray-200 hover:border-primary-red transition-colors"
                          aria-label="Next image"
                        >
                          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-lg">No Image Available</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <button
                      key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImageIndex === index
                            ? 'border-primary-red ring-2 ring-primary-red ring-offset-2 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <div className="w-full h-full bg-white p-1 flex items-center justify-center">
                          <img
                            src={img}
                            alt={`${product.title} view ${index + 1}`}
                            className={`w-full h-full object-contain transition-opacity ${
                              selectedImageIndex === index ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div>
              <h1 className="text-4xl font-bold text-black mb-4">{product.title}</h1>
              <p className="text-3xl font-bold text-primary-red mb-6">${product.price}</p>
              
              {product.category && (
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                    {product.category.name}
                  </span>
                </div>
              )}
              
              <div className="mb-6 pb-6 border-b-2 border-gray-200">
                <p className="text-gray-700 leading-relaxed">{product.description || 'No description available.'}</p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Stock:</span>
                  <span className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {cartMessage && (
                <div className={`mb-4 px-4 py-2 rounded-md text-sm ${
                  cartMessage.includes('maximum') 
                    ? 'bg-yellow-50 border-2 border-yellow-200 text-yellow-700'
                    : 'bg-green-50 border-2 border-green-200 text-green-700'
                }`}>
                  {cartMessage}
                </div>
              )}
              <button
                onClick={() => {
                  // Check if product is already in cart and if adding would exceed stock
                  const existingItem = cartItems.find((item) => item.id === product.id)
                  const currentQuantity = existingItem ? existingItem.quantity : 0
                  
                  if (currentQuantity >= product.stock) {
                    setCartMessage(`Maximum quantity (${product.stock}) already in cart`)
                    setTimeout(() => setCartMessage(''), 3000)
                    return
                  }
                  
                  addToCart(product, 1)
                  setAddedToCart(true)
                  setCartMessage('')
                  setTimeout(() => {
                    setAddedToCart(false)
                  }, 2000)
                }}
                disabled={product.stock === 0}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 ${
                  product.stock === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary-red hover:bg-red-700 hover:shadow-lg'
                }`}
              >
                {addedToCart ? '✓ Added to Cart!' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

