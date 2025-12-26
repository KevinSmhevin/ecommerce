import { createContext, useContext, useState, useEffect } from 'react'
import axios from '../config/axios'

const AppContext = createContext()

const API_BASE_URL = 'http://127.0.0.1:8000/api'

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/categories/`)
      // Handle both paginated and non-paginated responses
      const categoriesData = response.data.results || response.data
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (err) {
      setError(err.message)
      setCategories([]) // Ensure it's always an array
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/products/`, { params })
      setProducts(response.data.results || response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductBySlug = async (slug) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/products/`)
      const allProducts = response.data.results || response.data
      const product = allProducts.find(p => p.slug === slug)
      return product
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryBySlug = async (slug) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/categories/`)
      const categoriesData = response.data.results || response.data
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []
      const category = categoriesArray.find(c => c.slug === slug)
      return category
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const value = {
    categories,
    products,
    loading,
    error,
    fetchCategories,
    fetchProducts,
    fetchProductBySlug,
    fetchCategoryBySlug,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

