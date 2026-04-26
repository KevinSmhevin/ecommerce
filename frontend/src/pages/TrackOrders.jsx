import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from '../config/axios'
import PageSpinner from '../components/PageSpinner'
import OrderCard from '../components/OrderCard'

const TrackOrders = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      axios.get('/account/api/track-orders')
        .then(r => setOrders(r.data.orders || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  if (authLoading || loading) return <PageSpinner />
  if (!user) return null

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-black uppercase tracking-widest">Track Orders</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mt-1">
            Your order history and tracking information
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-48 border-2 border-black rounded-xl">
            <p className="text-black font-black uppercase tracking-widest text-sm">No orders yet.</p>
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
