import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useShippingQuery } from '@/hooks/useShippingQuery'
import { useCompleteOrderMutation } from '@/hooks/useCompleteOrderMutation'
import type { ShippingAddress } from '@/api/shipping'
import type { FieldErrors } from '@/api/auth'
import PageSpinner from '@/components/PageSpinner'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID ||
  'AVAko6odHX3mTKAL0agrKszZhfBgKGOM00SjEAr2NyZd5UuzNzRpR6ZSA-jgh4brZYH5ss0vD_yHA8Fm'

const EMPTY_FORM: ShippingAddress = {
  full_name: '',
  email: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zipcode: '',
}

const REQUIRED_FIELDS: Array<keyof ShippingAddress> = ['full_name', 'email', 'address1', 'city']

const isAxiosErrorShape = (
  err: unknown,
): err is { response?: { data?: { error?: string; errors?: FieldErrors } } } =>
  err !== null && typeof err === 'object' && 'response' in (err as Record<string, unknown>)

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart()
  const { data: user } = useAuthQuery()
  const navigate = useNavigate()
  const paypalRef = useRef<HTMLDivElement | null>(null)

  const [formData, setFormData] = useState<ShippingAddress>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [formValid, setFormValid] = useState(false)

  const shippingQuery = useShippingQuery(Boolean(user))
  const completeOrderMutation = useCompleteOrderMutation()

  // Bounce empty cart back to /cart.
  useEffect(() => {
    if (cartItems.length === 0) navigate('/cart')
  }, [cartItems.length, navigate])

  // Seed form with the saved shipping address (when authenticated).
  useEffect(() => {
    if (!user) return
    if (shippingQuery.data) {
      const saved = shippingQuery.data
      const hasSaved = Object.keys(saved).length > 0
      setFormData((prev) => ({
        ...prev,
        ...(hasSaved ? saved : {}),
        email: saved.email || user.email || prev.email,
      }) as ShippingAddress)
    } else if (shippingQuery.isError) {
      setFormData((prev) => ({ ...prev, email: user.email || prev.email }))
    }
  }, [user, shippingQuery.data, shippingQuery.isError])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    setError('')
  }

  useEffect(() => {
    setFormValid(REQUIRED_FIELDS.every((f) => formData[f]?.trim().length > 0))
  }, [formData.full_name, formData.email, formData.address1, formData.city])

  // Load the PayPal SDK once.
  useEffect(() => {
    if (window.paypal) {
      setPaypalLoaded(true)
      return
    }
    if (paypalLoaded) return
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo`
    script.async = true
    script.onload = () => setPaypalLoaded(true)
    document.body.appendChild(script)
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [paypalLoaded])

  const handleCompleteOrder = async () => {
    setError('')
    setErrors({})
    try {
      const result = await completeOrderMutation.mutateAsync({
        cart_items: cartItems,
        shipping: { ...formData, address2: formData.address2?.trim() || '' },
      })
      if (result.success) {
        clearCart()
        navigate('/payment-success', { state: { orderId: result.order_id } })
      } else {
        setError(result.error ?? 'Failed to complete order')
        if (result.errors) setErrors(result.errors)
        navigate('/payment-failed')
      }
    } catch (err) {
      if (isAxiosErrorShape(err)) {
        setError(err.response?.data?.error ?? 'Failed to complete order')
        if (err.response?.data?.errors) setErrors(err.response.data.errors)
      } else {
        setError('Failed to complete order')
      }
      navigate('/payment-failed')
    }
  }

  // Render PayPal buttons whenever the SDK is ready and we have a cart.
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || !paypalRef.current || cartItems.length === 0) return
    paypalRef.current.innerHTML = ''
    window.paypal
      .Buttons({
        style: { color: 'gold', shape: 'rect', layout: 'vertical' },
        onInit: (_data, actions) => {
          actions.disable()
          const check = () => {
            const valid = REQUIRED_FIELDS.every((f) => {
              const el = document.getElementById(f) as HTMLInputElement | null
              return Boolean(el?.value?.trim())
            })
            if (valid) actions.enable()
            else actions.disable()
          }
          document.querySelectorAll<HTMLInputElement>('input[required]').forEach((el) => {
            el.addEventListener('input', check)
            el.addEventListener('change', check)
          })
          check()
        },
        createOrder: (_data, actions) =>
          actions.order.create({
            purchase_units: [{ amount: { value: getCartTotal().toFixed(2) } }],
          }),
        onApprove: async (_data, actions) => {
          try {
            await actions.order.capture()
            await handleCompleteOrder()
          } catch {
            navigate('/payment-failed')
          }
        },
        onError: () => navigate('/payment-failed'),
      })
      .render(paypalRef.current)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalLoaded, cartItems, formValid])

  if (user && shippingQuery.isPending) return <PageSpinner />
  if (cartItems.length === 0) return null

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Shipping form */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-black text-white uppercase tracking-widest mb-6">Shipping Information</h2>

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

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Payment</h3>
                  <div ref={paypalRef} />
                  {!formValid && (
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider mt-3">
                      Fill in required fields to enable payment
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="glass-red rounded-2xl p-6 sticky top-4">
              <h2 className="text-base font-black text-white uppercase tracking-widest mb-5">Summary</h2>
              <div className="space-y-3 mb-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-white/50 font-bold line-clamp-1 flex-1 pr-2">
                      {item.title} ×{item.quantity}
                    </span>
                    <span className="font-black text-white shrink-0">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="font-black text-white uppercase tracking-wider">Total</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
                  <span className="text-xl font-black text-white">${getCartTotal().toFixed(2)}</span>
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
