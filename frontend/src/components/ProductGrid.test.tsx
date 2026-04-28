import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import ProductGrid from './ProductGrid'

vi.mock('@/config/axios', () => {
  const get = vi.fn()
  return {
    default: {
      get,
      defaults: {},
      interceptors: { request: { use: vi.fn() } },
    },
  }
})

import axios from '@/config/axios'
const mockedGet = axios.get as ReturnType<typeof vi.fn>

const productsPage = (page: number, count = 30) => ({
  data: {
    count,
    next: null,
    previous: null,
    results: Array.from({ length: count > 15 ? 15 : count }, (_, i) => ({
      id: (page - 1) * 15 + i + 1,
      title: `Card ${(page - 1) * 15 + i + 1}`,
      slug: `card-${(page - 1) * 15 + i + 1}`,
      price: '9.99',
      stock: 10,
      units_sold: 0,
      image_url: null,
      image2_url: null,
      image3_url: null,
      image4_url: null,
    })),
  },
})

const categoriesResp = {
  data: [
    { id: 1, name: 'Pokemon', slug: 'pokemon' },
    { id: 2, name: 'One Piece', slug: 'one-piece' },
  ],
}

const renderGrid = (categorySlug?: string, title?: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<ProductGrid categorySlug={categorySlug} title={title} />, { wrapper })
}

describe('ProductGrid', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/categories/') return Promise.resolve(categoriesResp)
      if (url === '/api/products/') return Promise.resolve(productsPage(1))
      return Promise.reject(new Error(`unexpected url ${url}`))
    })
  })

  it('renders product cards from the products query', async () => {
    renderGrid()
    expect(await screen.findByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 15')).toBeInTheDocument()
  })

  it('renders the title and total count badge', async () => {
    renderGrid(undefined, 'Featured')
    expect(screen.getByText('Featured')).toBeInTheDocument()
    expect(await screen.findByText('30')).toBeInTheDocument()
  })

  it('renders categories from the categories query in the filter dropdown', async () => {
    renderGrid()
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pokemon' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'One Piece' })).toBeInTheDocument()
    })
  })

  it('passes ordering=price when user selects price asc', async () => {
    const user = userEvent.setup()
    renderGrid()
    await screen.findByText('Card 1')

    const sortSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(sortSelect, 'price_asc')

    await waitFor(() => {
      const productsCalls = mockedGet.mock.calls.filter(([url]) => url === '/api/products/')
      const lastCall = productsCalls[productsCalls.length - 1]
      expect(lastCall[1]).toMatchObject({ params: expect.objectContaining({ ordering: 'price' }) })
    })
  })

  it('passes the category param when categorySlug prop is set', async () => {
    renderGrid('pokemon')
    await waitFor(() => {
      const productsCall = mockedGet.mock.calls.find(([url]) => url === '/api/products/')
      expect(productsCall?.[1]).toMatchObject({ params: expect.objectContaining({ category: 'pokemon' }) })
    })
  })

  it('shows the empty state when no products are returned', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/categories/') return Promise.resolve(categoriesResp)
      return Promise.resolve({ data: { count: 0, next: null, previous: null, results: [] } })
    })
    renderGrid()
    expect(await screen.findByText(/no products found/i)).toBeInTheDocument()
  })
})
