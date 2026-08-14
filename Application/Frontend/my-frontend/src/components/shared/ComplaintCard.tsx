import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, User, Paperclip, ArrowRight } from 'lucide-react'
import { cn, formatDate, timeAgo } from '@/lib/utils'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import type { Complaint } from '@/types'

interface ComplaintCardProps {
  complaint: Complaint
  variant?: 'citizen' | 'officer' | 'admin' | 'compact'
  onClick?: () => void
  className?: string
}

export function ComplaintCard({ complaint, variant = 'officer', onClick, className }: ComplaintCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(`/officer/cases/${complaint.id}`)
    }
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white',
          'hover:bg-gray-50 cursor-pointer transition-colors',
          className
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label={`View complaint ${complaint.referenceNumber}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-600">{complaint.referenceNumber}</span>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{complaint.title}</p>
        </div>
        <PriorityBadge priority={complaint.priority} />
        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
    )
  }

  return (
    <Card
      className={cn('hover:shadow-md transition-shadow cursor-pointer', className)}
      onClick={handleClick}
      role="article"
      aria-label={`Complaint ${complaint.referenceNumber}: ${complaint.title}`}
    >
      <CardContent className="pt-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-xs font-mono text-blue-600 font-medium">
                {complaint.referenceNumber}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{complaint.title}</h3>
          </div>
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(complaint.createdAt)}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{complaint.description}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {complaint.location.district}
            {complaint.location.ward ? `, ${complaint.location.ward}` : ''}
          </span>

          {(variant === 'officer' || variant === 'admin') && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" aria-hidden="true" />
              {complaint.citizenName}
            </span>
          )}

          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {formatDate(complaint.createdAt)}
          </span>

          {complaint.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" aria-hidden="true" />
              {complaint.attachments.length}
            </span>
          )}

          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">
            {complaint.category.replace('_', ' ')}
          </span>
        </div>

        {/* Officer assignment (for officer/admin views) */}
        {variant !== 'citizen' && complaint.assignedOfficerName && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-500">
            <span>Assigned to</span>
            <span className="font-medium text-gray-700">{complaint.assignedOfficerName}</span>
            {complaint.department && (
              <>
                <span>·</span>
                <span>{complaint.department}</span>
              </>
            )}
          </div>
        )}

        {/* Due date warning */}
        {complaint.dueDate && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
          <div className={cn(
            'mt-2 pt-2 border-t border-gray-100 text-xs flex items-center gap-1',
            new Date(complaint.dueDate) < new Date()
              ? 'text-red-600 font-medium'
              : 'text-gray-400'
          )}>
            <Calendar className="w-3 h-3" aria-hidden="true" />
            Due: {formatDate(complaint.dueDate)}
            {new Date(complaint.dueDate) < new Date() && ' (Overdue)'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
