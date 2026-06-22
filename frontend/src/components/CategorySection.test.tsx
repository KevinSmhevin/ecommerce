import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import CategorySection from './CategorySection'

vi.mock('@/config/axios', () => {
  const get = vi.fn()
  return { default: { get, defaults: {}, interceptors: { request: { use: vi.fn() } } } }
})

import axios from '@/config/axios'
const mockedGet = axios.get as ReturnType<typeof vi.fn>

const category = { id: 1, name: 'Graded One Piece', slug: 'graded-one-piece' }

const makeProducts = (n: number) => ({
  data: {
    count: n,
    next: null,
    previous: null,
    results: Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      title: `Card ${i + 1}`,
      slug: `card-${i + 1}`,
      price: '9.99',
      stock: 5,
      units_sold: 0,
      image_url: null,
      image2_url: null,
      image3_url: null,
      image4_url: null,
    })),
  },
})

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<CategorySection category={category} />, { wrapper })
}

describe('CategorySection', () => {
  beforeEach(() => {
    mockedGet.mockReset()
  })

  it('renders the category name without the "Graded" prefix and a View all link to the category page', async () => {
    mockedGet.mockResolvedValue(makeProducts(3))
    renderSection()
    expect(await screen.findByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('One Piece')).toBeInTheDocument()
    expect(screen.queryByText('Graded One Piece')).not.toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view all/i })
    expect(link).toHaveAttribute('href', '/category/graded-one-piece')
  })

  it('renders at most 12 product cards even when more are returned', async () => {
    mockedGet.mockResolvedValue(makeProducts(20))
    renderSection()
    expect(await screen.findByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 12')).toBeInTheDocument()
    expect(screen.queryByText('Card 13')).not.toBeInTheDocument()
  })

  it('queries products filtered by the category slug', async () => {
    mockedGet.mockResolvedValue(makeProducts(3))
    renderSection()
    await waitFor(() => {
      const call = mockedGet.mock.calls.find(([url]) => url === '/api/products/')
      expect(call?.[1]).toMatchObject({
        params: expect.objectContaining({ category: 'graded-one-piece' }),
      })
    })
  })

  it('renders nothing when the category has no products', async () => {
    mockedGet.mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } })
    const { container } = renderSection()
    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
