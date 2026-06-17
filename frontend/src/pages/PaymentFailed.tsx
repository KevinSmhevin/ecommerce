import { Link } from 'react-router-dom'

const PaymentFailed = () => (
  <div className="min-h-screen flex items-center justify-center py-12 px-4">
    <div className="w-full max-w-md glass-red rounded-2xl p-8 text-center">
      <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_16px_rgba(220,38,38,0.5)]">
        <span className="text-white font-black text-2xl">✗</span>
      </div>
      <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-3 glow-red">Payment Failed</h1>
      <p className="text-white/50 text-sm font-bold mb-8">
        There was an issue processing your payment. Please try again or contact support.
      </p>
      <div className="space-y-3">
        <Link
          to="/cart"
          className="block w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-colors"
        >
          Return to Cart
        </Link>
        <Link
          to="/"
          className="block w-full py-3 glass glass-hover text-white font-black uppercase tracking-widest text-sm rounded-xl transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  </div>
)

export default PaymentFailed
