import axios, { type InternalAxiosRequestConfig } from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://pokebin-api.onrender.com')

axios.defaults.baseURL = API_URL
axios.defaults.withCredentials = true

let csrfToken: string | null = null

const getCsrfToken = async (): Promise<string | null> => {
  if (!csrfToken) {
    try {
      const response = await axios.get<{ csrfToken: string }>('/account/api/csrf-token')
      csrfToken = response.data.csrfToken
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
    }
  }
  return csrfToken
}

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = config.method?.toLowerCase()
  if (method && UNSAFE_METHODS.has(method)) {
    const token = await getCsrfToken()
    if (token && config.headers) {
      config.headers['X-CSRFToken'] = token
    }
  }
  return config
})

export default axios
