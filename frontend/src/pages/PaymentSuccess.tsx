import { Link, useLocation } from 'react-router-dom'

interface PaymentSuccessLocationState {
  orderId?: string | number
}

const PaymentSuccess = () => {
  const location = useLocation()
  const state = location.state as PaymentSuccessLocationState | null
  const orderId = state?.orderId

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md glass rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-emerald-300 font-black text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Payment Successful</h1>
        {orderId && (
          <p className="text-white/50 text-sm font-bold mb-1">
            Order <span className="text-white font-black">#{orderId}</span>
          </p>
        )}
        <p className="text-white/50 text-sm font-bold mb-8">
          You'll receive an email confirmation shortly.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-colors"
          >
            Continue Shopping
          </Link>
          {orderId && (
            <Link
              to="/check-order"
              className="block w-full py-3 glass glass-hover text-white font-black uppercase tracking-widest text-sm rounded-xl transition-colors"
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
