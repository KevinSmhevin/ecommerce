import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import axios from '../config/axios'
import PageSpinner from '../components/PageSpinner'
import FormField from '../components/FormField'
import Alert from '../components/Alert'

const ProfileManagement = () => {
  const { data: user, isPending: authLoading, refetch: checkAuth } = useAuthQuery()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', email: '' })
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
      axios.get('/account/api/profile-management')
        .then(r => setFormData({ username: r.data.username, email: r.data.email }))
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
      const r = await axios.post('/account/api/profile-management', formData)
      if (r.data.success) {
        setSuccess(true)
        await checkAuth()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
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
          <h1 className="text-2xl font-black text-black uppercase tracking-widest">Profile</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mt-1">
            Update your account information
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-6" style={{ boxShadow: '4px 4px 0 #000' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && <Alert type="success">Profile updated successfully!</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <FormField id="username" label="Username" type="text" required
              value={formData.username} onChange={handleChange} error={errors.username} />
            <FormField id="email" label="Email" type="email" required
              value={formData.email} onChange={handleChange} error={errors.email} />

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfileManagement
