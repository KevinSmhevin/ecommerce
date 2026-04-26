import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FormField from '../components/FormField'
import Alert from '../components/Alert'

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password1: '', password2: '' })
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/') }, [user, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setLoading(true)
    const result = await register(formData)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => navigate('/'), 3000)
    } else {
      setError(result.message)
      if (result.errors) setErrors(result.errors)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div
          className="w-full max-w-md bg-white border-2 border-black rounded-2xl p-8 text-center"
          style={{ boxShadow: '6px 6px 0 #000' }}
        >
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-lg">✓</span>
          </div>
          <h2 className="text-xl font-black text-black uppercase tracking-widest mb-3">Account Created</h2>
          <p className="text-gray-500 text-sm font-bold mb-6">
            Check your email to verify your account before logging in.
          </p>
          <Link to="/login" className="text-red-600 text-sm font-black uppercase tracking-widest hover:text-red-700 transition-colors">
            Go to Login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div
          className="bg-white border-2 border-black rounded-2xl p-8"
          style={{ boxShadow: '6px 6px 0 #000' }}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-black text-black uppercase tracking-widest">Create Account</h1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mt-1">
              Already have one?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 transition-colors">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert type="error">{error}</Alert>}

            <FormField id="username" label="Username" type="text" required placeholder="Username"
              value={formData.username} onChange={handleChange} error={errors.username} />
            <FormField id="email" label="Email" type="email" required placeholder="Email"
              value={formData.email} onChange={handleChange} error={errors.email} />
            <FormField id="password1" label="Password" type="password" required placeholder="Password"
              value={formData.password1} onChange={handleChange} error={errors.password1} />
            <FormField id="password2" label="Confirm Password" type="password" required placeholder="Confirm Password"
              value={formData.password2} onChange={handleChange} error={errors.password2} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
