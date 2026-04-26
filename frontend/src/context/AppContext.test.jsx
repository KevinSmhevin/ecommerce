import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'

vi.mock('../config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import axios from '../config/axios'

// Minimal consumer that renders observable state and exposes action buttons.
const AppConsumer = () => {
  const { categories, products, loading, error, fetchProducts, fetchProductBySlug, fetchCategoryBySlug } = useApp()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error || 'null'}</span>
      <span data-testid="categories">{JSON.stringify(categories)}</span>
      <span data-testid="products">{JSON.stringify(products)}</span>
      <button data-testid="fetch-products" onClick={() => fetchProducts()}>Fetch Products</button>
      <button data-testid="fetch-by-slug" onClick={async () => {
        const p = await fetchProductBySlug('charizard')
        document.getElementById('slug-result').textContent = p ? p.title : 'not-found'
      }}>
        Fetch By Slug
      </button>
      <button data-testid="fetch-cat-by-slug" onClick={async () => {
        const c = await fetchCategoryBySlug('pokemon')
        document.getElementById('cat-result').textContent = c ? c.name : 'not-found'
      }}>
        Fetch Cat By Slug
      </button>
      <span id="slug-result"></span>
      <span id="cat-result"></span>
    </div>
  )
}

const renderApp = () => render(<AppProvider><AppConsumer /></AppProvider>)

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // -------------------------
  // categories initialization
  // -------------------------
  describe('fetchCategories (called on mount)', () => {
    it('populates categories from paginated response', async () => {
      axios.get.mockResolvedValueOnce({
        data: { results: [{ id: 1, name: 'Pokemon', slug: 'pokemon' }] },
      })

      renderApp()
      await waitFor(() => {
        const cats = JSON.parse(screen.getByTestId('categories').textContent)
        expect(cats).toHaveLength(1)
        expect(cats[0].name).toBe('Pokemon')
      })
    })

    it('populates categories from non-paginated response', async () => {
      axios.get.mockResolvedValueOnce({
        data: [{ id: 1, name: 'Pokemon', slug: 'pokemon' }, { id: 2, name: 'Trainer', slug: 'trainer' }],
      })

      renderApp()
      await waitFor(() => {
        const cats = JSON.parse(screen.getByTestId('categories').textContent)
        expect(cats).toHaveLength(2)
      })
    })

    it('sets categories to [] when fetch fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'))

      renderApp()
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
      const cats = JSON.parse(screen.getByTestId('categories').textContent)
      expect(cats).toHaveLength(0)
    })

    it('sets error state when fetch fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'))

      renderApp()
      await waitFor(() => expect(screen.getByTestId('error')).not.toHaveTextContent('null'))
      expect(screen.getByTestId('error')).toHaveTextContent('Network error')
    })

    it('handles a response where data is not an array gracefully', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: null } })

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      const cats = JSON.parse(screen.getByTestId('categories').textContent)
      expect(Array.isArray(cats)).toBe(true)
    })
  })

  // -------------------------
  // fetchProducts
  // -------------------------
  describe('fetchProducts', () => {
    it('populates products on successful fetch', async () => {
      // Mount call (fetchCategories)
      axios.get.mockResolvedValueOnce({ data: { results: [] } })
      // fetchProducts call
      axios.get.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'Charizard', slug: 'charizard', price: '49.99', stock: 5 }] },
      })

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-products').click())
      await waitFor(() => {
        const prods = JSON.parse(screen.getByTestId('products').textContent)
        expect(prods).toHaveLength(1)
        expect(prods[0].title).toBe('Charizard')
      })
    })

    it('sets error state when fetchProducts fails', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: [] } })
      axios.get.mockRejectedValueOnce(new Error('Server down'))

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-products').click())
      await waitFor(() => expect(screen.getByTestId('error')).not.toHaveTextContent('null'))
    })
  })

  // -------------------------
  // fetchProductBySlug
  // -------------------------
  describe('fetchProductBySlug', () => {
    it('returns the product matching the slug', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: [] } }) // categories mount
      axios.get.mockResolvedValueOnce({
        data: {
          results: [
            { id: 1, title: 'Charizard', slug: 'charizard', price: '49.99', stock: 5 },
            { id: 2, title: 'Pikachu', slug: 'pikachu', price: '9.99', stock: 3 },
          ],
        },
      })

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-by-slug').click())
      await waitFor(() => expect(document.getElementById('slug-result').textContent).toBe('Charizard'))
    })

    it('returns undefined when no product matches the slug', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: [] } }) // categories
      axios.get.mockResolvedValueOnce({ data: { results: [{ id: 1, title: 'Pikachu', slug: 'pikachu' }] } })

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-by-slug').click())
      await waitFor(() => expect(document.getElementById('slug-result').textContent).toBe('not-found'))
    })

    it('returns null when the fetch throws', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: [] } }) // categories
      axios.get.mockRejectedValueOnce(new Error('500'))

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-by-slug').click())
      await waitFor(() => expect(document.getElementById('slug-result').textContent).toBe('not-found'))
    })
  })

  // -------------------------
  // fetchCategoryBySlug
  // -------------------------
  describe('fetchCategoryBySlug', () => {
    it('returns the category matching the slug', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: [] } }) // mount categories
      axios.get.mockResolvedValueOnce({
        data: { results: [{ id: 1, name: 'Pokemon', slug: 'pokemon' }] },
      })

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-cat-by-slug').click())
      await waitFor(() => expect(document.getElementById('cat-result').textContent).toBe('Pokemon'))
    })

    it('returns undefined when no category matches', async () => {
      axios.get.mockResolvedValueOnce({ data: { results: [] } }) // mount
      axios.get.mockResolvedValueOnce({ data: { results: [{ id: 1, name: 'Trainer', slug: 'trainer' }] } })

      renderApp()
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
      await act(async () => screen.getByTestId('fetch-cat-by-slug').click())
      await waitFor(() => expect(document.getElementById('cat-result').textContent).toBe('not-found'))
    })
  })

  // -------------------------
  // Hook outside provider
  // -------------------------
  describe('useApp outside provider', () => {
    it('throws when called outside AppProvider', () => {
      const Bad = () => { useApp(); return null }
      expect(() => render(<Bad />)).toThrow('useApp must be used within AppProvider')
    })
  })
})
