import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useProfileQuery } from '@/hooks/useProfileQuery'
import { useUpdateProfileMutation } from '@/hooks/useUpdateProfileMutation'
import type { ProfileData } from '@/api/account'
import type { FieldErrors } from '@/api/auth'
import PageSpinner from '@/components/PageSpinner'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'

const EMPTY_PROFILE: ProfileData = { username: '', email: '' }

const isAxiosErrorShape = (
  err: unknown,
): err is { response?: { data?: { error?: string; errors?: FieldErrors } } } =>
  err !== null && typeof err === 'object' && 'response' in (err as Record<string, unknown>)

const ProfileManagement = () => {
  const { data: user, isPending: authLoading } = useAuthQuery()
  const profileQuery = useProfileQuery(Boolean(user))
  const updateProfile = useUpdateProfileMutation()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<ProfileData>(EMPTY_PROFILE)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (profileQuery.data) {
      setFormData({ username: profileQuery.data.username, email: profileQuery.data.email })
    }
  }, [profileQuery.data])

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
      const result = await updateProfile.mutateAsync(formData)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? 'Failed to update profile')
        if (result.errors) setErrors(result.errors)
      }
    } catch (err) {
      if (isAxiosErrorShape(err)) {
        setError(err.response?.data?.error ?? 'Failed to update profile')
        if (err.response?.data?.errors) setErrors(err.response.data.errors)
      } else {
        setError('Failed to update profile')
      }
    }
  }

  if (authLoading || (user && profileQuery.isPending)) return <PageSpinner />
  if (!user) return null

  const saving = updateProfile.isPending

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
