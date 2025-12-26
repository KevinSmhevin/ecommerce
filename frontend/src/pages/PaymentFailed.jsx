import { Link } from 'react-router-dom'

const PaymentFailed = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg border-2 border-gray-200 shadow-lg text-center">
        <div className="text-red-600 text-6xl mb-4">✗</div>
        <h2 className="text-3xl font-bold text-black mb-4">
          Payment Failed
        </h2>
        <p className="text-gray-600 mb-6">
          There was an issue processing your payment. Please try again or contact support if the problem persists.
        </p>
        <div className="space-y-3">
          <Link
            to="/cart"
            className="block w-full py-3 px-6 rounded-lg font-bold text-white bg-primary-red hover:bg-red-700 transition-colors"
          >
            Return to Cart
          </Link>
          <Link
            to="/"
            className="block w-full py-3 px-6 rounded-lg font-bold text-black border-2 border-gray-300 hover:border-primary-red hover:text-primary-red transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentFailed


