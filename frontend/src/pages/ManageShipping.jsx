import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import axios from '../config/axios'
import PageSpinner from '../components/PageSpinner'
import FormField from '../components/FormField'
import Alert from '../components/Alert'

const EMPTY = { full_name: '', email: '', address1: '', address2: '', city: '', state: '', zipcode: '' }

const ManageShipping = () => {
  const { data: user, isPending: authLoading } = useAuthQuery()
  const navigate = useNavigate()
  const [formData, setFormData] = useState(EMPTY)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      axios.get('/account/api/manage-shipping')
        .then(r => { if (r.data && Object.keys(r.data).length > 0) setFormData(r.data) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null })
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setSuccess(false)
    setSaving(true)
    try {
      const r = await axios.post('/account/api/manage-shipping', formData)
      if (r.data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save shipping address')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <PageSpinner />
  if (!user) return null

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
