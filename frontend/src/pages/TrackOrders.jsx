import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from '../config/axios'

const TrackOrders = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/account/api/track-orders')
      setOrders(response.data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Track Orders</h1>
          <p className="text-gray-600">View your order history and tracking information</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">You have no orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
                <div className="mb-6 pb-4 border-b-2 border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-black">Order #{order.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      order.shipped ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.shipped ? 'Shipped' : 'Processing'}
                    </span>
                  </div>
                  <p className="text-gray-600">Ordered on {formatDate(order.date_ordered)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-bold text-black mb-2">Customer Information</h4>
                    <p className="text-gray-700">{order.full_name}</p>
                    <p className="text-gray-700">{order.email}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black mb-2">Shipping Address</h4>
                    <p className="text-gray-700 whitespace-pre-line">{order.shipping_address}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-black mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-black">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-black">${item.total}</p>
                          <p className="text-sm text-gray-600">${item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-black">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-red">${order.amount_paid}</span>
                  </div>

                  <div className="space-y-2">
                    {order.shipped && order.date_shipped && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Shipped on:</span>
                        <span className="text-gray-700">{formatDate(order.date_shipped)}</span>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Tracking Number:</span>
                        <span className="font-medium text-black">{order.tracking_number}</span>
                      </div>
                    )}
                    {order.courier && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Courier:</span>
                        <span className="text-gray-700">{order.courier}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackOrders




