import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  showTotal?: boolean
  className?: string
}

const Pagination = ({
  current,
  total,
  pageSize,
  onChange,
  showTotal = true,
  className,
}: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize)
  
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (current >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange(page)
    }
  }

  return (
    <div className={cn('flex items-center justify-between py-4', className)}>
      {showTotal && (
        <span className="text-sm text-gray-600">
          共 {total} 条记录，第 {current} / {totalPages} 页
        </span>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
            current === 1
              ? 'cursor-not-allowed text-gray-300 border-gray-200'
              : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-primary-500 hover:text-primary-700'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={typeof page !== 'number' || page === current}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-md border text-sm transition-colors px-2',
              page === current
                ? 'bg-primary-700 text-white border-primary-700'
                : typeof page === 'number'
                ? 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-primary-500 hover:text-primary-700'
                : 'cursor-default text-gray-400 border-transparent'
            )}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
            current === totalPages
              ? 'cursor-not-allowed text-gray-300 border-gray-200'
              : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-primary-500 hover:text-primary-700'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
