import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from '../config/axios'

// Get PayPal client ID from environment variable, fallback to sandbox for development
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AVAko6odHX3mTKAL0agrKszZhfBgKGOM00SjEAr2NyZd5UuzNzRpR6ZSA-jgh4brZYH5ss0vD_yHA8Fm'

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const paypalButtonContainerRef = useRef(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipcode: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [formValid, setFormValid] = useState(false)

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart')
      return
    }

    // Load shipping address if user is logged in
    if (user) {
      fetchShippingAddress()
    } else {
      setLoading(false)
    }
  }, [user, cartItems, navigate])

  const fetchShippingAddress = async () => {
    try {
      const response = await axios.get('/account/api/manage-shipping')
      if (response.data && Object.keys(response.data).length > 0) {
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || user?.email || '',
          address1: response.data.address1 || '',
          address2: response.data.address2 || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zipcode: response.data.zipcode || '',
        })
      } else {
        // Prefill email if user is logged in
        setFormData(prev => ({
          ...prev,
          email: user?.email || '',
        }))
      }
    } catch (error) {
      console.error('Error fetching shipping address:', error)
      // Prefill email if user is logged in
      setFormData(prev => ({
        ...prev,
        email: user?.email || '',
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null,
      })
    }
    setError('')
    checkFormValidity()
  }

  const checkFormValidity = () => {
    const required = ['full_name', 'email', 'address1', 'city']
    const isValid = required.every(field => formData[field] && formData[field].trim() !== '')
    setFormValid(isValid)
    return isValid
  }

  useEffect(() => {
    const required = ['full_name', 'email', 'address1', 'city']
    const isValid = required.every(field => formData[field] && formData[field].trim() !== '')
    setFormValid(isValid)
  }, [formData.full_name, formData.email, formData.address1, formData.city])

  // Load PayPal SDK
  useEffect(() => {
    if (!window.paypal && !paypalLoaded) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo`
      script.async = true
      script.onload = () => {
        setPaypalLoaded(true)
      }
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    } else if (window.paypal && !paypalLoaded) {
      setPaypalLoaded(true)
    }
  }, [paypalLoaded])

  // Initialize PayPal buttons
  useEffect(() => {
    if (paypalLoaded && window.paypal && paypalButtonContainerRef.current && cartItems.length > 0) {
      // Clear previous buttons
      paypalButtonContainerRef.current.innerHTML = ''

      const totalPrice = getCartTotal().toFixed(2)

      const paypalButtons = window.paypal.Buttons({
        style: {
          color: 'gold',
          shape: 'rect',
          layout: 'vertical'
        },
        onInit: (data, actions) => {
          // Disable buttons initially
          actions.disable()
          
          // Enable/disable based on form validity
          const checkValidity = () => {
            const required = ['full_name', 'email', 'address1', 'city']
            const isValid = required.every(field => {
              const input = document.getElementById(field)
              return input && input.value && input.value.trim() !== ''
            })
            if (isValid) {
              actions.enable()
            } else {
              actions.disable()
            }
          }
          
          // Check validity on input changes
          const inputs = document.querySelectorAll('input[required]')
          inputs.forEach(input => {
            input.addEventListener('input', checkValidity)
            input.addEventListener('change', checkValidity)
          })
          
          // Initial check
          checkValidity()
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalPrice
              }
            }]
          })
        },
        onApprove: async (data, actions) => {
          try {
            const details = await actions.order.capture()
            console.log('Transaction completed by', details.payer.name.given_name)
            
            // Complete the order
            await handleCompleteOrder()
          } catch (error) {
            console.error('Error capturing payment:', error)
            navigate('/payment-failed')
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err)
          navigate('/payment-failed')
        }
      })

      paypalButtons.render(paypalButtonContainerRef.current).catch((err) => {
        console.error('PayPal Buttons failed to render:', err)
      })
    }
  }, [paypalLoaded, cartItems, getCartTotal, navigate, formValid])

  const handleCompleteOrder = async () => {
    setError('')
    setErrors({})
    setSubmitting(true)

    try {
      // Clean up form data - remove empty address2 if it's just whitespace
      const cleanedFormData = {
        ...formData,
        address2: formData.address2?.trim() || '',
      }
      
      const response = await axios.post('/payment/api/complete-order', {
        cart_items: cartItems,
        shipping: cleanedFormData,
      })

      if (response.data.success) {
        clearCart()
        navigate('/payment-success', { state: { orderId: response.data.order_id } })
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to complete order')
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
      navigate('/payment-failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Form submission is handled by PayPal button
    // This prevents default form submission
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-black mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-black mb-6">Shipping Information</h2>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    id="address1"
                    name="address1"
                    type="text"
                    required
                    value={formData.address1}
                    onChange={handleChange}
                    className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                  />
                  {errors.address1 && (
                    <p className="mt-1 text-sm text-red-600">{errors.address1[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    id="address2"
                    name="address2"
                    type="text"
                    value={formData.address2}
                    onChange={handleChange}
                    className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city[0]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    id="zipcode"
                    name="zipcode"
                    type="text"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                  />
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold text-black mb-4">Payment</h3>
                  <div id="paypal-button-container" ref={paypalButtonContainerRef}></div>
                  {!formValid && (
                    <p className="text-sm text-gray-600 mt-2">
                      Please fill in all required fields to enable payment
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-black mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.title} x {item.quantity}
                    </span>
                    <span className="text-black font-medium">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between text-xl font-bold text-black mb-2">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
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

