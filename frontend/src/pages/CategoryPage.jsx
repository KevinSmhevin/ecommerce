import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import Pagination from '../components/Pagination'
import { useApp } from '../context/AppContext'
import { StadiumProductCard } from './HomeStadium'
import { ChevronRight } from 'lucide-react'

const CategoryPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { categories } = useApp()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const categoriesList = Array.isArray(categories) ? categories : []

  useEffect(() => { setCurrentPage(1) }, [slug, sortBy])
  useEffect(() => { fetchCategoryAndProducts() }, [slug, sortBy, currentPage])

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true)
      const categoryResponse = await axios.get('/api/categories/')
      const categoriesData = categoryResponse.data.results || categoryResponse.data
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []
      const foundCategory = categoriesArray.find(c => c.slug === slug)

      if (!foundCategory) {
        setCategory(null)
        setProducts([])
        setTotalPages(1)
        setTotalCount(0)
        return
      }

      setCategory(foundCategory)

      const params = { category: slug, page: currentPage }
      if (sortBy === 'price_asc') params.ordering = 'price'
      else if (sortBy === 'price_desc') params.ordering = '-price'

      const productsResponse = await axios.get('/api/products/', { params })
      if (productsResponse.data.results) {
        setProducts(productsResponse.data.results)
        setTotalPages(Math.ceil(productsResponse.data.count / 15))
        setTotalCount(productsResponse.data.count)
      } else {
        const arr = Array.isArray(productsResponse.data) ? productsResponse.data : []
        setProducts(arr)
        setTotalPages(1)
        setTotalCount(arr.length)
      }
    } catch {
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

  const handleCategoryChange = (e) => {
    const val = e.target.value
    if (val === 'all') navigate('/')
    else navigate(`/category/${val}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div
          className="bg-white border-2 border-black rounded-xl px-12 py-10 text-center"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          <p className="text-black font-black uppercase tracking-widest text-sm">Category not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Filter bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-6 py-4 bg-white border-2 border-black rounded-xl"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-sm rotate-45 shrink-0" />
            <h2 className="text-black text-base font-black uppercase tracking-widest">{category.name}</h2>
            {totalCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded">
                {totalCount}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={slug}
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black transition-colors">Home</button>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-black">{category.name}</span>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-48 border-2 border-black rounded-xl">
            <p className="text-black font-black uppercase tracking-widest text-sm">No products found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <StadiumProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  )
}

export default CategoryPage
