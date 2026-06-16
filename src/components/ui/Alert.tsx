import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'
import { ReactNode, useState } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  dismissible?: boolean
  icon?: ReactNode
  className?: string
}

const Alert = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  icon,
  className,
}: AlertProps) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const variants: Record<AlertVariant, { bg: string; border: string; text: string; icon: ReactNode }> = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-500" />,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
  }

  const { bg, border, text, icon: defaultIcon } = variants[variant]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        bg,
        border,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon || defaultIcon}
      </div>
      <div className="flex-1">
        {title && (
          <h4 className={cn('font-medium', text)}>{title}</h4>
        )}
        <p className={cn('text-sm', title ? 'mt-1' : '', text)}>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => setIsVisible(false)}
          className={cn(
            'flex-shrink-0 rounded-md p-1 transition-colors',
            'hover:bg-white/50',
            text
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default Alert
