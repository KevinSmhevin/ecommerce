import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import axios from '../config/axios'
import Pagination from '../components/Pagination'
import { ChevronRight } from 'lucide-react'

/* ─── Reusable product card ─────────────────────────────────── */
export const StadiumProductCard = ({ product }) => (
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

/* ─── Home page ─────────────────────────────────────────────── */
const HomeStadium = () => {
  const { loading, categories } = useApp()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [sortBy, setSortBy] = useState('default')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)

  const categoriesList = Array.isArray(categories) ? categories : []

  useEffect(() => { setCurrentPage(1) }, [sortBy])
  useEffect(() => { loadProducts() }, [sortBy, currentPage])

  const loadProducts = async () => {
    try {
      setPageLoading(true)
      const params = { page: currentPage }
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
    if (slug !== 'all') navigate(`/category/${slug}`)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const miniBanners = [
    { title: 'Graded Pokemon English',  image: '/banners/mini/graded-pokemon-english.png',  link: '/category/graded-pokemon-english' },
    { title: 'Graded Pokemon Japanese', image: '/banners/mini/graded-pokemon-japanese.png', link: '/category/graded-pokemon-japanese' },
    { title: 'Graded One Piece',        image: '/banners/mini/graded-one-piece.png',         link: '/category/graded-one-piece' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div
          className="relative h-[380px] md:h-[480px] bg-black overflow-hidden rounded-2xl"
          style={{ border: '4px solid #000', boxShadow: '8px 8px 0 #DC2626' }}
        >
          {/* Diagonal red block */}
          <div
            className="absolute inset-0 bg-red-600"
            style={{ clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 28% 100%)' }}
          />
          {/* Dot grid on red side */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 28% 100%)',
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Text content */}
          <div className="relative h-full flex flex-col justify-center px-10 md:px-16 max-w-[58%]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-red-500" />
              <p className="text-red-500 text-xs font-black uppercase tracking-widest">Premium TCG Store</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-[0.9] mb-6 tracking-tight">
              CATCH<br />
              <span className="text-red-500">EVERY</span><br />
              CARD.
            </h1>
            <a
              href="#products"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-colors self-start rounded-xl"
              style={{ border: '3px solid #fff', boxShadow: '4px 4px 0 #DC2626' }}
            >
              SHOP NOW <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Rotated label on red side */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 text-xs font-black uppercase tracking-[0.35em] rotate-90 select-none whitespace-nowrap">
            Pokémon · One Piece · Graded
          </div>
        </div>
      </div>

      {/* ── MINI BANNERS ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {miniBanners.map((b) => (
            <Link
              key={b.title}
              to={b.link}
              className="group relative h-44 overflow-hidden rounded-xl border-2 border-black transition-all duration-200"
              style={{ boxShadow: '4px 4px 0 #000' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0 #DC2626'; e.currentTarget.style.borderColor = '#DC2626' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0 #000'; e.currentTarget.style.borderColor = '#000' }}
            >
              <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors" />
              <div className="relative h-full flex flex-col items-start justify-end p-5">
                <h3 className="text-white text-sm font-black uppercase tracking-wider drop-shadow">{b.title}</h3>
                <span className="flex items-center gap-1 text-white/70 group-hover:text-red-400 text-xs font-bold uppercase tracking-widest mt-1 transition-colors">
                  Browse <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── PRODUCTS ──────────────────────────────────────── */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-8">

        {/* Filter bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-6 py-4 bg-white border-2 border-black rounded-xl"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-sm rotate-45 shrink-0" />
            <h2 className="text-black text-base font-black uppercase tracking-widest">All Products</h2>
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

        {/* Product grid */}
        {loading || pageLoading ? (
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

export default HomeStadium
