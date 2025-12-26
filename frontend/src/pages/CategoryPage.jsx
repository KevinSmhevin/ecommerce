import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from '../config/axios'
import Pagination from '../components/Pagination'

const CategoryPage = () => {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when category or sorting changes
  }, [slug, sortBy])

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [slug, sortBy, currentPage])

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true)
      
      // Fetch categories - handle paginated response
      const categoryResponse = await axios.get('/api/categories/')
      const categoriesData = categoryResponse.data.results || categoryResponse.data
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []
      const foundCategory = categoriesArray.find(c => c.slug === slug)
      
      if (!foundCategory) {
        console.warn(`Category with slug "${slug}" not found. Available categories:`, categoriesArray.map(c => c.slug))
        setCategory(null)
        setProducts([])
        setTotalPages(1)
        setTotalCount(0)
        return
      }
      
      setCategory(foundCategory)

      // Fetch products filtered by category
      const params = { category: slug, page: currentPage }
      if (sortBy === 'price_asc') {
        params.ordering = 'price'
      } else if (sortBy === 'price_desc') {
        params.ordering = '-price'
      }

      const productsResponse = await axios.get('/api/products/', { params })
      
      // Handle paginated response
      if (productsResponse.data.results) {
        setProducts(productsResponse.data.results)
        setTotalPages(Math.ceil(productsResponse.data.count / 15))
        setTotalCount(productsResponse.data.count)
      } else {
        // Fallback for non-paginated response
        const productsArray = Array.isArray(productsResponse.data) ? productsResponse.data : []
        setProducts(productsArray)
        setTotalPages(1)
        setTotalCount(productsArray.length)
      }
    } catch (error) {
      console.error('Error fetching category data:', error)
      console.error('Error details:', error.response?.data)
      setProducts([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600 text-lg">Category not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">{category.name}</h1>
          <p className="text-gray-600">Browse products in this category</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-gray-300 rounded-md px-4 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red transition-colors"
            >
              <option value="default">Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No products found in this category.</p>
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
                  <h3 className="font-semibold text-black mb-2 line-clamp-2">{product.name || product.title}</h3>
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
      </div>
    </div>
  )
}

export default CategoryPage

