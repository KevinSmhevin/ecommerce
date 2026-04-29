import { Link } from 'react-router-dom'

const PaymentFailed = () => (
  <div className="min-h-screen flex items-center justify-center py-12 px-4">
    <div
      className="w-full max-w-md bg-white border-2 border-black rounded-2xl p-8 text-center"
      style={{ boxShadow: '6px 6px 0 #DC2626' }}
    >
      <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
        <span className="text-white font-black text-2xl">✗</span>
      </div>
      <h1 className="text-2xl font-black text-black uppercase tracking-widest mb-3">Payment Failed</h1>
      <p className="text-gray-500 text-sm font-bold mb-8">
        There was an issue processing your payment. Please try again or contact support.
      </p>
      <div className="space-y-3">
        <Link
          to="/cart"
          className="block w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-red-700 transition-colors"
        >
          Return to Cart
        </Link>
        <Link
          to="/"
          className="block w-full py-3 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl border-2 border-black hover:bg-black hover:text-white transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  </div>
)

export default PaymentFailed
