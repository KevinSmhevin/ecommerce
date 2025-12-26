import { createContext, useContext, useState, useEffect } from 'react'
import axios from '../config/axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('/account/api/check-auth')
      if (response.data.authenticated) {
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await axios.post('/account/api/login', { username, password })
      if (response.data.success) {
        setUser(response.data.user)
        return { success: true, message: response.data.message }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Login failed',
      }
    }
  }

  const register = async (formData) => {
    try {
      const response = await axios.post('/account/api/register', formData)
      if (response.data.success) {
        return { success: true, message: response.data.message }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Registration failed',
        errors: error.response?.data?.errors,
      }
    }
  }

  const logout = async () => {
    try {
      const response = await axios.post('/account/api/logout', {})
      if (response.data.success) {
        setUser(null)
        // Force a re-check of auth status
        await checkAuth()
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear user state even if API call fails
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

