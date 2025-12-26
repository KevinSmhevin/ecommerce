import axios from 'axios'

// Get API URL from environment variable, fallback to relative paths for production
const API_URL = import.meta.env.VITE_API_URL || ''

// Configure base URL if provided
if (API_URL) {
  axios.defaults.baseURL = API_URL
}

// Configure axios to send credentials (cookies) with all requests
axios.defaults.withCredentials = true

// Get CSRF token and set it for all requests
let csrfToken = null

const getCsrfToken = async () => {
  if (!csrfToken) {
    try {
      const response = await axios.get('/account/api/csrf-token')
      csrfToken = response.data.csrfToken
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
    }
  }
  return csrfToken
}

// Request interceptor to add CSRF token
axios.interceptors.request.use(async (config) => {
  // Only add CSRF token for POST, PUT, PATCH, DELETE requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    const token = await getCsrfToken()
    if (token) {
      config.headers['X-CSRFToken'] = token
    }
  }
  return config
})

export default axios

