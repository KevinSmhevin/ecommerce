import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import axios from '../config/axios'
import Pagination from './Pagination'
import ProductCard from './ProductCard'

const ProductGrid = ({ categorySlug, title = 'All Products' }) => {
  const { loading: appLoading, categories } = useApp()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [sortBy, setSortBy] = useState('default')
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)

  const categoriesList = Array.isArray(categories) ? categories : []

  useEffect(() => {
    setCurrentPage(1)
    setSortBy('default')
    setSelectedCategory(categorySlug || 'all')
  }, [categorySlug])

  useEffect(() => { setCurrentPage(1) }, [sortBy])
  useEffect(() => { loadProducts() }, [categorySlug, sortBy, currentPage])

  const loadProducts = async () => {
    try {
      setPageLoading(true)
      const params = { page: currentPage }
      if (categorySlug) params.category = categorySlug
      if (sortBy === 'price_asc') params.ordering = 'price'
      else if (sortBy === 'price_desc') params.ordering = '-price'
      const response = await axios.get('/api/products/', { params })
      if (response.data.results) {
        setProducts(response.data.results)
        setTotalPages(Math.ceil(response.data.count / 15))
        setTotalCount(response.data.count)
      } else {
        setProducts(Array.isArray(response.data) ? response.data : [])
        setTotalPages(1)
        setTotalCount(response.data.length || 0)
      }
    } catch {
      setProducts([])
    } finally {
      setPageLoading(false)
    }
  }

  const handleCategoryChange = (e) => {
    const slug = e.target.value
    setSelectedCategory(slug)
    if (slug === 'all') navigate('/')
    else navigate(`/category/${slug}`)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-8">

      {/* Filter bar */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-6 py-4 bg-white border-2 border-black rounded-xl"
        style={{ boxShadow: '4px 4px 0 #000' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-600 rounded-sm rotate-45 shrink-0" />
          <h2 className="text-black text-base font-black uppercase tracking-widest">{title}</h2>
          {totalCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded">
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="bg-white border-2 border-black rounded-lg text-black text-sm font-bold uppercase tracking-wider px-4 py-2 focus:outline-none focus:border-red-600 transition-colors w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border-2 border-black rounded-lg text-black text-sm font-bold uppercase tracking-wider px-4 py-2 focus:outline-none focus:border-red-600 transition-colors w-full sm:w-auto"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {appLoading || pageLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-black border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center h-48 border-2 border-black rounded-xl">
          <p className="text-black font-black uppercase tracking-widest text-sm">No products found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}

export default ProductGrid
