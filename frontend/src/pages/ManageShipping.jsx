import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from '../config/axios'

const ManageShipping = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipcode: '',
  })
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      fetchShipping()
    }
  }, [user])

  const fetchShipping = async () => {
    try {
      const response = await axios.get('/account/api/manage-shipping')
      if (response.data && Object.keys(response.data).length > 0) {
        setFormData(response.data)
      }
    } catch (error) {
      console.error('Error fetching shipping address:', error)
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
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setSuccess(false)
    setSaving(true)

    try {
      const response = await axios.post('/account/api/manage-shipping', formData)
      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save shipping address')
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Manage Shipping Address</h1>
          <p className="text-gray-600">Update your shipping information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8">
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              Shipping address saved successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
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
                Email
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
                Address Line 1
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
                Address Line 2 (Optional)
              </label>
              <input
                id="address2"
                name="address2"
                type="text"
                value={formData.address2}
                onChange={handleChange}
                className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
              />
              {errors.address2 && (
                <p className="mt-1 text-sm text-red-600">{errors.address2[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
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
                  State/Province (Optional)
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP/Postal Code (Optional)
              </label>
              <input
                id="zipcode"
                name="zipcode"
                type="text"
                value={formData.zipcode}
                onChange={handleChange}
                className="w-full appearance-none relative block px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red sm:text-sm"
              />
              {errors.zipcode && (
                <p className="mt-1 text-sm text-red-600">{errors.zipcode[0]}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-6 rounded-lg font-bold text-white bg-primary-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Shipping Address'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ManageShipping




