import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import axios from '../config/axios'
import Pagination from '../components/Pagination'

const HomeArcade = () => {
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
    { title: 'Graded Pokemon English', image: '/banners/mini/graded-pokemon-english.png', link: '/category/graded-pokemon-english' },
    { title: 'Graded Pokemon Japanese', image: '/banners/mini/graded-pokemon-japanese.png', link: '/category/graded-pokemon-japanese' },
    { title: 'Graded One Piece', image: '/banners/mini/graded-one-piece.png', link: '/category/graded-one-piece' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── HERO ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div
          className="relative h-[380px] md:h-[480px] rounded-lg overflow-hidden arcade-grid"
          style={{ border: '1px solid rgba(220,38,38,0.3)', boxShadow: '0 0 40px rgba(220,38,38,0.08)' }}
        >
          {/* Corner brackets */}
          {[['top-4 left-4', 'border-t-2 border-l-2'], ['top-4 right-4', 'border-t-2 border-r-2'],
            ['bottom-4 left-4', 'border-b-2 border-l-2'], ['bottom-4 right-4', 'border-b-2 border-r-2']].map(([pos, borders], i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 border-red-500/70 ${borders}`} />
          ))}

          {/* Scanline effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)' }}
          />

          <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
            <p
              className="text-xs font-black tracking-[0.4em] uppercase mb-3"
              style={{ color: 'rgba(220,38,38,0.9)', textShadow: '0 0 8px rgba(220,38,38,0.6)' }}
            >
              ▶ INSERT COIN TO CONTINUE ◀
            </p>
            <h1
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-none mb-2"
              style={{ textShadow: '3px 3px 0 #DC2626, 6px 6px 0 rgba(220,38,38,0.3)' }}
            >
              CATCH EVERY
            </h1>
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6"
              style={{ color: '#DC2626', textShadow: '3px 3px 0 #fff, 0 0 30px rgba(220,38,38,0.5)' }}
            >
              RARE CARD
            </h1>
            <p className="text-zinc-400 text-base md:text-lg mb-8 max-w-lg">
              Premium Pokémon TCG · Graded Collectibles · Japanese &amp; English
            </p>
            <a
              href="#products"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm hover:bg-red-500 transition-colors rounded"
              style={{ boxShadow: '4px 4px 0 #fff, 0 0 20px rgba(220,38,38,0.5)' }}
            >
              SHOP NOW ▶
            </a>
          </div>
        </div>
      </div>

      {/* ── MINI CATEGORY BANNERS ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {miniBanners.map((b) => (
            <Link
              key={b.title}
              to={b.link}
              className="group relative h-44 rounded overflow-hidden"
              style={{ border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-zinc-950/60 group-hover:bg-zinc-950/40 transition-colors" />
              {/* Red accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 8px rgba(220,38,38,0.8)' }} />
              <div className="relative h-full flex items-end p-4">
                <h3 className="text-white text-base font-black uppercase tracking-wider drop-shadow-md">{b.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-8">

        {/* Filter bar */}
        <div
          className="rounded-lg p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          style={{ background: '#18181b', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-red-600 rounded-full" style={{ boxShadow: '0 0 8px rgba(220,38,38,0.8)' }} />
            <h2 className="text-lg font-black text-white uppercase tracking-widest">All Products</h2>
            {totalCount > 0 && (
              <span className="text-xs text-zinc-500 font-bold">— {totalCount} items</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-bold uppercase tracking-wider rounded px-4 py-2 focus:outline-none focus:border-red-500 transition-colors w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-bold uppercase tracking-wider rounded px-4 py-2 focus:outline-none focus:border-red-500 transition-colors w-full sm:w-auto"
            >
              <option value="default">Default</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading || pageLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Loading...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-zinc-500 text-sm font-bold uppercase tracking-widest">
            No products found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group relative rounded-lg overflow-hidden transition-all duration-200"
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(220,38,38,0.5)'
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(220,38,38,0.12), 0 0 40px rgba(220,38,38,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '1px solid #27272a'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Top accent bar on hover */}
                  <div className="h-0.5 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="p-4">
                    {/* Image */}
                    <div className="aspect-square mb-4 bg-zinc-900 rounded overflow-hidden flex items-center justify-center border border-zinc-800">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-zinc-600 text-xs uppercase tracking-widest">No Image</span>
                      )}
                    </div>

                    <h3 className="text-white text-sm font-bold mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                      {product.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span
                        className="text-lg font-black text-red-500"
                        style={{ textShadow: '0 0 8px rgba(220,38,38,0.4)' }}
                      >
                        ${product.price}
                      </span>
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        VIEW ▶
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  )
}

export default HomeArcade
