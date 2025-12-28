import { Link, useLocation } from 'react-router-dom'

const PaymentSuccess = () => {
  const location = useLocation()
  const orderId = location.state?.orderId

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg border-2 border-gray-200 shadow-lg text-center">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h2 className="text-3xl font-bold text-black mb-4">
          Payment Successful!
        </h2>
        {orderId && (
          <p className="text-gray-600 mb-2">
            Your order number is: <span className="font-bold text-black">#{orderId}</span>
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Thank you for your purchase! You will receive an email confirmation shortly.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full py-3 px-6 rounded-lg font-bold text-white bg-primary-red hover:bg-red-700 transition-colors"
          >
            Continue Shopping
          </Link>
          {orderId && (
            <Link
              to="/check-order"
              className="block w-full py-3 px-6 rounded-lg font-bold text-black border-2 border-gray-300 hover:border-primary-red hover:text-primary-red transition-colors"
            >
              Check Order Status
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess



