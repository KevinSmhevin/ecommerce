import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useCategoryBySlugQuery } from '@/hooks/useCategoryBySlugQuery'
import PageSpinner from '@/components/PageSpinner'
import ProductGrid from '@/components/ProductGrid'

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: category, isPending } = useCategoryBySlugQuery(slug)

  if (isPending) return <PageSpinner />

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl px-12 py-10 text-center">
          <p className="text-white font-black uppercase tracking-widest text-sm">Category not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <button onClick={() => navigate('/')} className="text-white/50 hover:text-white transition-colors">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-white/30" />
          <span className="text-white">{category.name}</span>
        </div>
      </div>
      <ProductGrid categorySlug={slug} title={category.name} />
    </div>
  )
}

export default CategoryPage
