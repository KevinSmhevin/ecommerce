import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Alert from './Alert'

describe('Alert component', () => {
  describe('rendering message content', () => {
    it('renders text children', () => {
      render(<Alert>Something went wrong</Alert>)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('renders JSX children', () => {
      render(<Alert><span data-testid="inner">Nested</span></Alert>)
      expect(screen.getByTestId('inner')).toBeInTheDocument()
    })
  })

  describe('error variant (default)', () => {
    it('applies error classes when type is "error"', () => {
      render(<Alert type="error">Error!</Alert>)
      const el = screen.getByText('Error!').closest('div')
      expect(el).toHaveClass('bg-red-50')
      expect(el).toHaveClass('border-red-200')
      expect(el).toHaveClass('text-red-700')
    })

    it('defaults to error styles when no type prop is provided', () => {
      render(<Alert>Default</Alert>)
      const el = screen.getByText('Default').closest('div')
      expect(el).toHaveClass('bg-red-50')
      expect(el).toHaveClass('text-red-700')
    })

    it('does not apply success classes for error type', () => {
      render(<Alert type="error">Error</Alert>)
      const el = screen.getByText('Error').closest('div')
      expect(el).not.toHaveClass('bg-green-50')
      expect(el).not.toHaveClass('text-green-700')
    })
  })

  describe('success variant', () => {
    it('applies success classes when type is "success"', () => {
      render(<Alert type="success">All good!</Alert>)
      const el = screen.getByText('All good!').closest('div')
      expect(el).toHaveClass('bg-green-50')
      expect(el).toHaveClass('border-green-200')
      expect(el).toHaveClass('text-green-700')
    })

    it('does not apply error classes for success type', () => {
      render(<Alert type="success">Success</Alert>)
      const el = screen.getByText('Success').closest('div')
      expect(el).not.toHaveClass('bg-red-50')
      expect(el).not.toHaveClass('text-red-700')
    })
  })

  describe('shared styles', () => {
    it('always has the base border-2, rounded-xl, and font-bold classes', () => {
      render(<Alert>Test</Alert>)
      const el = screen.getByText('Test').closest('div')
      expect(el).toHaveClass('border-2')
      expect(el).toHaveClass('rounded-xl')
      expect(el).toHaveClass('font-bold')
    })
  })
})
