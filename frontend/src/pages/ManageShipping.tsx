import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useShippingQuery } from '@/hooks/useShippingQuery'
import { useSaveShippingMutation } from '@/hooks/useSaveShippingMutation'
import type { ShippingAddress } from '@/api/shipping'
import type { FieldErrors } from '@/api/auth'
import PageSpinner from '@/components/PageSpinner'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'

const EMPTY_ADDRESS: ShippingAddress = {
  full_name: '',
  email: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zipcode: '',
}

const isAxiosErrorShape = (
  err: unknown,
): err is { response?: { data?: { error?: string; errors?: FieldErrors } } } =>
  err !== null && typeof err === 'object' && 'response' in (err as Record<string, unknown>)

const ManageShipping = () => {
  const { data: user, isPending: authLoading } = useAuthQuery()
  const shippingQuery = useShippingQuery(Boolean(user))
  const saveShipping = useSaveShippingMutation()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    const saved = shippingQuery.data
    if (saved && Object.keys(saved).length > 0) {
      setFormData((prev) => ({ ...prev, ...saved }) as ShippingAddress)
    }
  }, [shippingQuery.data])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [success])

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
    setSuccess(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setSuccess(false)
    try {
      const result = await saveShipping.mutateAsync(formData)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? 'Failed to save shipping address')
        if (result.errors) setErrors(result.errors)
      }
    } catch (err) {
      if (isAxiosErrorShape(err)) {
        setError(err.response?.data?.error ?? 'Failed to save shipping address')
        if (err.response?.data?.errors) setErrors(err.response.data.errors)
      } else {
        setError('Failed to save shipping address')
      }
    }
  }

  if (authLoading || (user && shippingQuery.isPending)) return <PageSpinner />
  if (!user) return null

  const saving = saveShipping.isPending

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-black uppercase tracking-widest">Shipping Address</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mt-1">
            Saved for faster checkout
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-6" style={{ boxShadow: '4px 4px 0 #000' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && <Alert type="success">Shipping address saved!</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <FormField id="full_name" label="Full Name" type="text" required
              value={formData.full_name} onChange={handleChange} error={errors.full_name} />
            <FormField id="email" label="Email" type="email" required
              value={formData.email} onChange={handleChange} error={errors.email} />
            <FormField id="address1" label="Address Line 1" type="text" required
              value={formData.address1} onChange={handleChange} error={errors.address1} />
            <FormField id="address2" label="Address Line 2 (Optional)" type="text"
              value={formData.address2} onChange={handleChange} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="city" label="City" type="text" required
                value={formData.city} onChange={handleChange} error={errors.city} />
              <FormField id="state" label="State / Province (Optional)" type="text"
                value={formData.state} onChange={handleChange} />
            </div>

            <FormField id="zipcode" label="ZIP / Postal Code (Optional)" type="text"
              value={formData.zipcode} onChange={handleChange} />

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ManageShipping
