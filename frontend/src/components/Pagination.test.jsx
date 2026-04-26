import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from './Pagination'

describe('Pagination component', () => {
  let onPageChange

  beforeEach(() => {
    onPageChange = vi.fn()
  })

  // -------------------------
  // Rendering
  // -------------------------
  describe('rendering', () => {
    it('renders nothing when totalPages is 1', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />
      )
      expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing when totalPages is 0', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={onPageChange} />
      )
      expect(container).toBeEmptyDOMElement()
    })

    it('renders Previous and Next buttons when totalPages > 1', () => {
      render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
    })

    it('renders page number buttons', () => {
      render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /page 3/i })).toBeInTheDocument()
    })

    it('marks the current page with aria-current="page"', () => {
      render(<Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /page 2/i })).toHaveAttribute('aria-current', 'page')
    })

    it('does not mark non-current pages with aria-current', () => {
      render(<Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /page 1/i })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('button', { name: /page 3/i })).not.toHaveAttribute('aria-current')
    })
  })

  // -------------------------
  // Disabled states
  // -------------------------
  describe('disabled states', () => {
    it('disables the Previous button on page 1', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
    })

    it('disables the Next button on the last page', () => {
      render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
    })

    it('enables the Previous button on pages > 1', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /previous page/i })).not.toBeDisabled()
    })

    it('enables the Next button when not on the last page', () => {
      render(<Pagination currentPage={4} totalPages={5} onPageChange={onPageChange} />)
      expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled()
    })
  })

  // -------------------------
  // Click handlers
  // -------------------------
  describe('click handlers', () => {
    it('calls onPageChange with currentPage-1 when Previous is clicked', async () => {
      const user = userEvent.setup()
      render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)
      await user.click(screen.getByRole('button', { name: /previous page/i }))
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('calls onPageChange with currentPage+1 when Next is clicked', async () => {
      const user = userEvent.setup()
      render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)
      await user.click(screen.getByRole('button', { name: /next page/i }))
      expect(onPageChange).toHaveBeenCalledWith(4)
    })

    it('calls onPageChange with the page number when a page button is clicked', async () => {
      const user = userEvent.setup()
      render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />)
      await user.click(screen.getByRole('button', { name: /page 2/i }))
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('does not call onPageChange when a disabled Previous button is clicked', async () => {
      const user = userEvent.setup()
      render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
      await user.click(screen.getByRole('button', { name: /previous page/i }))
      expect(onPageChange).not.toHaveBeenCalled()
    })

    it('does not call onPageChange when a disabled Next button is clicked', async () => {
      const user = userEvent.setup()
      render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />)
      await user.click(screen.getByRole('button', { name: /next page/i }))
      expect(onPageChange).not.toHaveBeenCalled()
    })
  })

  // -------------------------
  // Ellipsis / windowing
  // -------------------------
  describe('page windowing with ellipsis', () => {
    it('shows all pages without ellipsis when totalPages <= 5', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
      expect(screen.queryByText('...')).not.toBeInTheDocument()
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByRole('button', { name: `Page ${i}` })).toBeInTheDocument()
      }
    })

    it('shows ellipsis when totalPages > 5 and currentPage is near the start', () => {
      render(<Pagination currentPage={2} totalPages={10} onPageChange={onPageChange} />)
      expect(screen.getByText('...')).toBeInTheDocument()
      // First page + last page should be visible
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    })

    it('shows ellipsis when totalPages > 5 and currentPage is near the end', () => {
      render(<Pagination currentPage={9} totalPages={10} onPageChange={onPageChange} />)
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    })

    it('shows two ellipses for a middle page in a large range', () => {
      render(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />)
      const ellipses = screen.getAllByText('...')
      expect(ellipses).toHaveLength(2)
    })
  })
})
