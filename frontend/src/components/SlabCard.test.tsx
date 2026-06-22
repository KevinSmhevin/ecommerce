import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SlabCard from './SlabCard'
import type { Product } from '@/types/api'

type SlabProduct = Pick<Product, 'slug' | 'title' | 'price' | 'image_url' | 'brand'>

const baseProduct: SlabProduct = {
  title: 'Charizard Holo',
  slug: 'charizard-holo',
  price: '49.99',
  image_url: 'https://example.com/charizard.jpg',
  brand: 'PSA',
}

const renderCard = (product: SlabProduct = baseProduct) =>
  render(
    <MemoryRouter>
      <SlabCard product={product} />
    </MemoryRouter>
  )

describe('SlabCard component', () => {
  it('renders the product title and price with a $ prefix', () => {
    renderCard()
    expect(screen.getByText('Charizard Holo')).toBeInTheDocument()
    expect(screen.getByText('$49.99')).toBeInTheDocument()
  })

  it('links to the product detail page using the slug', () => {
    renderCard({ ...baseProduct, slug: 'pikachu-v' })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/pikachu-v')
  })

  it('renders the product image when image_url is provided', () => {
    renderCard()
    const img = screen.getByRole('img', { name: 'Charizard Holo' })
    expect(img).toHaveAttribute('src', 'https://example.com/charizard.jpg')
  })

  it('renders a "No Image" placeholder when image_url is absent', () => {
    renderCard({ ...baseProduct, image_url: null })
    expect(screen.getByText(/no image/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows the brand when present and omits it when absent', () => {
    const { rerender } = renderCard()
    expect(screen.getByText('PSA')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <SlabCard product={{ ...baseProduct, brand: null }} />
      </MemoryRouter>
    )
    expect(screen.queryByText('PSA')).not.toBeInTheDocument()
  })
})
