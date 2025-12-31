import axios from 'axios'

// Get API URL from environment variable
// For local development, use empty string to rely on Vite proxy
// For production, use the production API URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://pokebin-api.onrender.com')

// Configure base URL (empty string means use relative URLs, which will use Vite proxy in dev)
axios.defaults.baseURL = API_URL

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

