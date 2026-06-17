import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useOrdersQuery } from '@/hooks/useOrdersQuery'
import PageSpinner from '@/components/PageSpinner'
import OrderCard from '@/components/OrderCard'

const TrackOrders = () => {
  const { data: user, isPending: authLoading } = useAuthQuery()
  const ordersQuery = useOrdersQuery(Boolean(user))
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  if (authLoading || (user && ordersQuery.isPending)) return <PageSpinner />
  if (!user) return null

  const orders = ordersQuery.data ?? []

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Track Orders</h1>
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider mt-1">
            Your order history and tracking information
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-48 glass rounded-2xl">
            <p className="text-white font-black uppercase tracking-widest text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackOrders
