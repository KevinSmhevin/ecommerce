import { useState } from 'react'
import axios from '../config/axios'

const CheckOrder = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setOrder(null)
    setLoading(true)

    try {
      const response = await axios.post(
        '/account/api/check-order',
        { order_number: orderNumber }
      )
      
      if (response.data.success) {
        setOrder(response.data.order)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to find order number')
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-4 sm:p-8 rounded-lg border-2 border-gray-200 shadow-lg">
          <h2 className="text-3xl font-bold text-black mb-6">Check Your Order</h2>
          
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter order number"
                required
                className="flex-1 appearance-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 border-2 border-transparent text-sm font-medium rounded-md text-white bg-primary-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {order && (
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h3 className="text-2xl font-bold text-black mb-2">
                  Order #{order.id}
                </h3>
                <p className="text-gray-600">
                  Ordered on {formatDate(order.date_ordered)}
                </p>
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
                  <div className="flex justify-between">
                    <span className="text-gray-700">Status:</span>
                    <span className={`font-bold ${order.shipped ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.shipped ? 'Shipped' : 'Processing'}
                    </span>
                  </div>
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
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckOrder

