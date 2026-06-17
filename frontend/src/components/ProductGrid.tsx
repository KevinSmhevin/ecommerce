import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import type { ProductOrdering } from '@/types/api'
import Pagination from './Pagination'
import ProductCard from './ProductCard'

interface ProductGridProps {
  categorySlug?: string
  title?: string
}

type SortOption = 'default' | 'price_asc' | 'price_desc'

const PAGE_SIZE = 15

const orderingFor = (sort: SortOption): ProductOrdering | undefined => {
  if (sort === 'price_asc') return 'price'
  if (sort === 'price_desc') return '-price'
  return undefined
}

const ProductGrid = ({ categorySlug, title = 'All Products' }: ProductGridProps) => {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug ?? 'all')

  useEffect(() => {
    setCurrentPage(1)
    setSortBy('default')
    setSelectedCategory(categorySlug ?? 'all')
  }, [categorySlug])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy])

  const productsQuery = useProductsQuery({
    page: currentPage,
    category: categorySlug,
    ordering: orderingFor(sortBy),
  })
  const categoriesQuery = useCategoriesQuery()

  const totalCount = productsQuery.data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const products = productsQuery.data?.results ?? []
  const categoriesList = categoriesQuery.data ?? []
  const isInitialLoading = productsQuery.isPending
  const isFetchingPage = productsQuery.isFetching && productsQuery.isPlaceholderData

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value
    setSelectedCategory(slug)
    if (slug === 'all') navigate('/')
    else navigate(`/category/${slug}`)
  }

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-8">
      <div className="glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-6 py-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-sm rotate-45 shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          <h2 className="text-white text-base font-black uppercase tracking-widest">{title}</h2>
          {totalCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.6)]">
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="bg-white/5 border border-white/15 rounded-lg text-white text-sm font-bold uppercase tracking-wider px-4 py-2 focus:outline-none focus:border-red-500 transition-colors w-full sm:w-auto [&>option]:bg-neutral-900 [&>option]:text-white"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="bg-white/5 border border-white/15 rounded-lg text-white text-sm font-bold uppercase tracking-wider px-4 py-2 focus:outline-none focus:border-red-500 transition-colors w-full sm:w-auto [&>option]:bg-neutral-900 [&>option]:text-white"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-white/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="glass flex items-center justify-center h-48 rounded-2xl">
          <p className="text-white/70 font-black uppercase tracking-widest text-sm">No products found.</p>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity ${
              isFetchingPage ? 'opacity-60' : 'opacity-100'
            }`}
          >
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
