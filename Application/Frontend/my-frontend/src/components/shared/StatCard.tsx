import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ElementType
  iconColor?: string
  iconBg?: string
  trend?: {
    value: number   // positive = up, negative = down
    label?: string  // e.g. "vs last week"
  }
  loading?: boolean
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  loading = false,
  className,
  onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="w-11 h-11 bg-gray-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null

  const trendColor = trend
    ? trend.value > 0
      ? 'text-green-600'
      : trend.value < 0
        ? 'text-red-600'
        : 'text-gray-500'
    : ''

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-400 truncate">{subtitle}</p>
            )}
            {trend && TrendIcon && (
              <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
                <TrendIcon className="w-3 h-3" aria-hidden="true" />
                <span>{Math.abs(trend.value)}% {trend.label ?? ''}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ml-3', iconBg)}>
              <Icon className={cn('w-5 h-5', iconColor)} aria-hidden="true" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
