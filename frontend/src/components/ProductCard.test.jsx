import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from './ProductCard'

const baseProduct = {
  id: 1,
  title: 'Charizard Holo',
  slug: 'charizard-holo',
  price: '49.99',
  stock: 5,
  image_url: 'https://example.com/charizard.jpg',
}

const renderCard = (product = baseProduct) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>
  )

describe('ProductCard component', () => {
  describe('rendering product information', () => {
    it('renders the product title', () => {
      renderCard()
      expect(screen.getByText('Charizard Holo')).toBeInTheDocument()
    })

    it('renders the product price with a $ prefix', () => {
      renderCard()
      expect(screen.getByText('$49.99')).toBeInTheDocument()
    })

    it('renders a link to the product detail page', () => {
      renderCard()
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/product/charizard-holo')
    })

    it('renders the product image when image_url is provided', () => {
      renderCard()
      const img = screen.getByRole('img', { name: 'Charizard Holo' })
      expect(img).toHaveAttribute('src', 'https://example.com/charizard.jpg')
      expect(img).toHaveAttribute('alt', 'Charizard Holo')
    })

    it('renders a "No Image" placeholder when image_url is absent', () => {
      renderCard({ ...baseProduct, image_url: null })
      expect(screen.getByText(/no image/i)).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('renders a "No Image" placeholder when image_url is empty string', () => {
      renderCard({ ...baseProduct, image_url: '' })
      expect(screen.getByText(/no image/i)).toBeInTheDocument()
    })
  })

  describe('link navigation', () => {
    it('uses the product slug to build the href', () => {
      renderCard({ ...baseProduct, slug: 'pikachu-v' })
      expect(screen.getByRole('link')).toHaveAttribute('href', '/product/pikachu-v')
    })
  })

  describe('visual indicator', () => {
    it('renders the red dot price indicator', () => {
      const { container } = renderCard()
      // The red dot is a div with bg-red-600 and rounded-full
      const dot = container.querySelector('.bg-red-600.rounded-full')
      expect(dot).toBeInTheDocument()
    })
  })
})
