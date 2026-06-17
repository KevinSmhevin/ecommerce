interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type PageItem = number | 'ellipsis'

const buildPageNumbers = (currentPage: number, totalPages: number): PageItem[] => {
  const maxVisible = 5
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  const pageNumbers = buildPageNumbers(currentPage, totalPages)

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
          currentPage === 1
            ? 'border-white/5 text-white/25 cursor-not-allowed'
            : 'glass glass-hover text-white/90'
        }`}
        aria-label="Previous page"
      >
        Previous
      </button>

      <div className="flex items-center space-x-2">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-white/40">
                ...
              </span>
            )
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                currentPage === page
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_16px_rgba(220,38,38,0.5)]'
                  : 'glass glass-hover text-white/90'
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
          currentPage === totalPages
            ? 'border-white/5 text-white/25 cursor-not-allowed'
            : 'glass glass-hover text-white/90'
        }`}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
