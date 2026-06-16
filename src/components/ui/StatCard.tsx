import { cn } from '@/lib/utils'
import { HTMLAttributes, ReactNode } from 'react'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'primary' | 'navy' | 'success' | 'warning' | 'danger' | 'info'
  subtitle?: string
}

const StatCard = ({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  subtitle,
  className,
  ...props
}: StatCardProps) => {
  const variants: Record<string, string> = {
    default: 'bg-white border-gray-200',
    primary: 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200',
    navy: 'bg-gradient-to-br from-navy-50 to-navy-100 border-navy-200',
    success: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
    warning: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
    danger: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
    info: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  }

  const iconVariants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary-100 text-primary-700',
    navy: 'bg-navy-100 text-navy-700',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  }

  return (
    <div
      className={cn('rounded-lg border p-5 shadow-sm', variants[variant], className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-dark-900 animate-count-up">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                'mt-2 inline-flex items-center text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
              <span className="ml-1 text-gray-500 font-normal">较上月</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              iconVariants[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
