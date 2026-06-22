import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import Hero from './Hero'
import { categorySectionId } from './CategorySection'

vi.mock('@/config/axios', () => {
  const get = vi.fn()
  return { default: { get, defaults: {}, interceptors: { request: { use: vi.fn() } } } }
})

import axios from '@/config/axios'
const mockedGet = axios.get as ReturnType<typeof vi.fn>

const categories = [
  { id: 1, name: 'Graded Pokemon English', slug: 'graded-pokemon-english' },
  { id: 2, name: 'Graded Pokemon Japanese', slug: 'graded-pokemon-japanese' },
  { id: 3, name: 'Graded One Piece', slug: 'graded-one-piece' },
  { id: 4, name: 'Funko Pops', slug: 'funko-pops' },
]

const renderHero = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<Hero />, { wrapper })
}

describe('Hero', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/categories/') return Promise.resolve({ data: categories })
      if (url === '/api/products/') {
        return Promise.resolve({ data: { count: 0, next: null, previous: null, results: [] } })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  })

  it('renders a button for each featured category with the "Graded" prefix stripped', async () => {
    renderHero()
    expect(await screen.findByRole('button', { name: 'Pokemon English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pokemon Japanese' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'One Piece' })).toBeInTheDocument()
  })

  it('omits non-featured categories', async () => {
    renderHero()
    await screen.findByRole('button', { name: 'Pokemon English' })
    expect(screen.queryByRole('button', { name: 'Funko Pops' })).not.toBeInTheDocument()
  })

  it('scrolls to the matching section when a category button is clicked', async () => {
    const user = userEvent.setup()
    const target = document.createElement('div')
    target.id = categorySectionId('graded-one-piece')
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    renderHero()
    const btn = await screen.findByRole('button', { name: 'One Piece' })
    await user.click(btn)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

    document.body.removeChild(target)
  })
})
