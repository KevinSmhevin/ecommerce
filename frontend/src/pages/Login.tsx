import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useLoginMutation } from '@/hooks/useLoginMutation'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { data: user } = useAuthQuery()
  const loginMutation = useLoginMutation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const result = await loginMutation.mutateAsync({ username, password })
    if (result.success) navigate('/')
    else setError(result.message)
  }

  const loading = loginMutation.isPending

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white uppercase tracking-widest">Sign In</h1>
            <p className="text-white/50 text-sm font-bold uppercase tracking-wider mt-1">
              No account?{' '}
              <Link to="/register" className="text-red-600 hover:text-red-700 transition-colors">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert type="error">{error}</Alert>}

            <FormField
              id="username"
              label="Username"
              type="text"
              required
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
