import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeMap = {
    sm: { wrapper: 'py-8', iconWrapper: 'w-10 h-10', icon: 'w-5 h-5', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-14', iconWrapper: 'w-14 h-14', icon: 'w-7 h-7', title: 'text-base', desc: 'text-sm' },
    lg: { wrapper: 'py-20', iconWrapper: 'w-20 h-20', icon: 'w-10 h-10', title: 'text-lg', desc: 'text-base' },
  }

  const s = sizeMap[size]

  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center', s.wrapper, className)}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div className={cn('rounded-full bg-gray-100 flex items-center justify-center mb-4', s.iconWrapper)}>
          <Icon className={cn('text-gray-400', s.icon)} aria-hidden="true" />
        </div>
      )}
      <p className={cn('font-semibold text-gray-700', s.title)}>{title}</p>
      {description && (
        <p className={cn('mt-1 text-gray-400 max-w-sm', s.desc)}>{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant ?? 'default'}
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
