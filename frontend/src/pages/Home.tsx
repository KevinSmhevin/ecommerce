import Hero from '@/components/Hero'
import CategorySection from '@/components/CategorySection'
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import { selectFeaturedCategories } from '@/lib/categories'

const Home = () => {
  const { data: categories = [], isPending } = useCategoriesQuery()
  const featuredCategories = selectFeaturedCategories(categories)

  return (
    <div className="min-h-screen">
      <Hero />
      <div className="pt-12">
        {isPending ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
          </div>
        ) : (
          featuredCategories.map((category) => <CategorySection key={category.id} category={category} />)
        )}
      </div>
    </div>
  )
}

export default Home
