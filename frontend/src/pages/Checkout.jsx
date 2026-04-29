import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import axios from '../config/axios'
import PageSpinner from '../components/PageSpinner'
import FormField from '../components/FormField'
import Alert from '../components/Alert'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AVAko6odHX3mTKAL0agrKszZhfBgKGOM00SjEAr2NyZd5UuzNzRpR6ZSA-jgh4brZYH5ss0vD_yHA8Fm'

const EMPTY_FORM = { full_name: '', email: '', address1: '', address2: '', city: '', state: '', zipcode: '' }

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart()
  const { data: user } = useAuthQuery()
  const navigate = useNavigate()
  const paypalRef = useRef(null)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [formValid, setFormValid] = useState(false)

  useEffect(() => {
    if (cartItems.length === 0) { navigate('/cart'); return }
    if (user) {
      axios.get('/account/api/manage-shipping')
        .then(r => {
          if (r.data && Object.keys(r.data).length > 0) {
            setFormData({ ...r.data, email: r.data.email || user?.email || '' })
          } else {
            setFormData(p => ({ ...p, email: user?.email || '' }))
          }
        })
        .catch(() => setFormData(p => ({ ...p, email: user?.email || '' })))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, cartItems, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null })
    setError('')
  }

  useEffect(() => {
    const req = ['full_name', 'email', 'address1', 'city']
    setFormValid(req.every(f => formData[f]?.trim()))
  }, [formData.full_name, formData.email, formData.address1, formData.city])

  useEffect(() => {
    if (!window.paypal && !paypalLoaded) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo`
      script.async = true
      script.onload = () => setPaypalLoaded(true)
      document.body.appendChild(script)
      return () => document.body.removeChild(script)
    } else if (window.paypal && !paypalLoaded) {
      setPaypalLoaded(true)
    }
  }, [paypalLoaded])

  useEffect(() => {
    if (paypalLoaded && window.paypal && paypalRef.current && cartItems.length > 0) {
      paypalRef.current.innerHTML = ''
      window.paypal.Buttons({
        style: { color: 'gold', shape: 'rect', layout: 'vertical' },
        onInit: (_, actions) => {
          actions.disable()
          const check = () => {
            const req = ['full_name', 'email', 'address1', 'city']
            const valid = req.every(f => { const el = document.getElementById(f); return el?.value?.trim() })
            valid ? actions.enable() : actions.disable()
          }
          document.querySelectorAll('input[required]').forEach(el => {
            el.addEventListener('input', check)
            el.addEventListener('change', check)
          })
          check()
        },
        createOrder: (_, actions) => actions.order.create({
          purchase_units: [{ amount: { value: getCartTotal().toFixed(2) } }]
        }),
        onApprove: async (_, actions) => {
          try {
            await actions.order.capture()
            await handleCompleteOrder()
          } catch {
            navigate('/payment-failed')
          }
        },
        onError: () => navigate('/payment-failed'),
      }).render(paypalRef.current).catch(() => {})
    }
  }, [paypalLoaded, cartItems, getCartTotal, navigate, formValid])

  const handleCompleteOrder = async () => {
    setError('')
    setErrors({})
    setSubmitting(true)
    try {
      const r = await axios.post('/payment/api/complete-order', {
        cart_items: cartItems,
        shipping: { ...formData, address2: formData.address2?.trim() || '' },
      })
      if (r.data.success) {
        clearCart()
        navigate('/payment-success', { state: { orderId: r.data.order_id } })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete order')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      navigate('/payment-failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner />
  if (cartItems.length === 0) return null

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-black text-black uppercase tracking-widest mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Shipping form */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-black rounded-2xl p-6" style={{ boxShadow: '4px 4px 0 #000' }}>
              <h2 className="text-base font-black text-black uppercase tracking-widest mb-6">Shipping Information</h2>

              {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="full_name" label="Full Name *" type="text" required
                    value={formData.full_name} onChange={handleChange} error={errors.full_name} />
                  <FormField id="email" label="Email *" type="email" required
                    value={formData.email} onChange={handleChange} error={errors.email} />
                </div>
                <FormField id="address1" label="Address Line 1 *" type="text" required
                  value={formData.address1} onChange={handleChange} error={errors.address1} />
                <FormField id="address2" label="Address Line 2 (Optional)" type="text"
                  value={formData.address2} onChange={handleChange} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="city" label="City *" type="text" required
                    value={formData.city} onChange={handleChange} error={errors.city} />
                  <FormField id="state" label="State / Province" type="text"
                    value={formData.state} onChange={handleChange} />
                </div>
                <FormField id="zipcode" label="ZIP / Postal Code" type="text"
                  value={formData.zipcode} onChange={handleChange} />

                <div className="pt-4 border-t border-black/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-black mb-4">Payment</h3>
                  <div ref={paypalRef} />
                  {!formValid && (
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-3">
                      Fill in required fields to enable payment
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div
              className="bg-white border-2 border-black rounded-2xl p-6 sticky top-4"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              <h2 className="text-base font-black text-black uppercase tracking-widest mb-5">Summary</h2>
              <div className="space-y-3 mb-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold line-clamp-1 flex-1 pr-2">
                      {item.title} ×{item.quantity}
                    </span>
                    <span className="font-black text-black shrink-0">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t-2 border-black flex justify-between items-center">
                <span className="font-black text-black uppercase tracking-wider">Total</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full" />
                  <span className="text-xl font-black text-black">${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
