import React from 'react'
import { cn, STATUS_COLORS, PRIORITY_COLORS, formatEnumLabel } from '@/lib/utils'
import type { ComplaintStatus, ComplaintPriority, CallStatus } from '@/types'

interface StatusBadgeProps {
  status: ComplaintStatus | CallStatus
  className?: string
}

interface PriorityBadgeProps {
  priority: ComplaintPriority
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'text-gray-600 bg-gray-50 border-gray-200'
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
        colorClass,
        className
      )}
    >
      {formatEnumLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colorClass = PRIORITY_COLORS[priority] ?? 'text-gray-600 bg-gray-50 border-gray-200'

  const dots: Record<ComplaintPriority, number> = {
    low: 1, medium: 2, high: 3, critical: 4,
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border',
        colorClass,
        className
      )}
    >
      {/* Priority dots indicator */}
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              i < dots[priority] ? 'bg-current' : 'bg-current opacity-20'
            )}
          />
        ))}
      </span>
      <span className="capitalize">{priority}</span>
    </span>
  )
}

interface SentimentBadgeProps {
  sentiment: string
  score?: number
  className?: string
}

export function SentimentBadge({ sentiment, score, className }: SentimentBadgeProps) {
  const colorMap: Record<string, string> = {
    positive: 'text-green-700 bg-green-50 border-green-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
    negative: 'text-red-700 bg-red-50 border-red-200',
    frustrated: 'text-orange-700 bg-orange-50 border-orange-200',
    urgent: 'text-red-700 bg-red-50 border-red-200',
  }

  const emojiMap: Record<string, string> = {
    positive: '😊', neutral: '😐', negative: '😠',
    frustrated: '😤', urgent: '🚨',
  }

  const colorClass = colorMap[sentiment] ?? colorMap.neutral

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
        colorClass,
        className
      )}
    >
      <span aria-hidden="true">{emojiMap[sentiment] ?? '😐'}</span>
      <span className="capitalize">{sentiment}</span>
      {score !== undefined && (
        <span className="opacity-70">({score > 0 ? '+' : ''}{score.toFixed(2)})</span>
      )}
    </span>
  )
}
