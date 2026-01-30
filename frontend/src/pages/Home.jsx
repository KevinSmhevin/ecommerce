import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import axios from '../config/axios'
import Banner from '../components/Banner'
import Pagination from '../components/Pagination'

const Home = () => {
  const { loading, categories } = useApp()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [sortBy, setSortBy] = useState('default')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)
  
  // Ensure categories is always an array
  const categoriesList = Array.isArray(categories) ? categories : []

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when sorting changes
  }, [sortBy])

  useEffect(() => {
    loadProducts()
  }, [sortBy, currentPage])

  const handleCategoryChange = (e) => {
    const categorySlug = e.target.value
    if (categorySlug === 'all') {
      setSelectedCategory('all')
      // Stay on home page
    } else {
      // Navigate to category page
      navigate(`/category/${categorySlug}`)
    }
  }

  const loadProducts = async () => {
    try {
      setPageLoading(true)
      const params = { page: currentPage }
      if (sortBy === 'price_asc') {
        params.ordering = 'price'
      } else if (sortBy === 'price_desc') {
        params.ordering = '-price'
      }
      
      const response = await axios.get('/api/products/', { params })
      
      // Handle paginated response
      if (response.data.results) {
        setProducts(response.data.results)
        setTotalPages(Math.ceil(response.data.count / 15))
        setTotalCount(response.data.count)
      } else {
        // Fallback for non-paginated response
        setProducts(Array.isArray(response.data) ? response.data : [])
        setTotalPages(1)
        setTotalCount(response.data.length || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setPageLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <Banner
          image="/banners/all-collections.png"
          title="Shop All Collections"
          subtitle="Explore our premium selection of Pokemon cards and collectibles"
          buttonText="Shop Now"
          buttonLink="#products"
          height="h-[400px] md:h-[500px] lg:h-[600px]"
          textPosition="center"
          overlay="medium"
        />
      </div>

      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-black">All Products</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border-2 border-gray-300 rounded-md px-4 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red transition-colors w-full sm:w-auto"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-2 border-gray-300 rounded-md px-4 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red transition-colors w-full sm:w-auto"
              >
                <option value="default">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {(loading || pageLoading) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : (
          <>
            {totalCount > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                Showing {((currentPage - 1) * 15) + 1} - {Math.min(currentPage * 15, totalCount)} of {totalCount} products
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="card p-4 hover:border-primary-red transition-colors"
                >
                  <div className="aspect-square mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-gray-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-black mb-2 line-clamp-2">{product.title}</h3>
                  <p className="text-xl font-bold text-primary-red">${product.price}</p>
                </Link>
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {!loading && !pageLoading && products.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No products found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

