import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn/ui utility — merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to human-readable string
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(dateString))
}

// Format date with time
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// Human-readable relative time (e.g. "2 hours ago")
export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateString)
}

// Format call duration seconds to mm:ss
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Format file size to human-readable
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Format enum key to display label (e.g. "in_progress" → "In Progress")
export function formatEnumLabel(key: string): string {
  return key.split('_').map(capitalize).join(' ')
}

// Build query string from object
export function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => search.append(key, String(v)))
      } else {
        search.append(key, String(value))
      }
    }
  })
  return search.toString()
}

// Priority color map
export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
}

// Status color map
export const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-blue-600 bg-blue-50 border-blue-200',
  acknowledged: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  in_progress: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  pending_info: 'text-orange-600 bg-orange-50 border-orange-200',
  escalated: 'text-red-600 bg-red-50 border-red-200',
  resolved: 'text-green-600 bg-green-50 border-green-200',
  closed: 'text-gray-600 bg-gray-50 border-gray-200',
  rejected: 'text-gray-500 bg-gray-50 border-gray-200',
}

// Call status color map
export const CALL_STATUS_COLORS: Record<string, string> = {
  queued: 'text-yellow-600 bg-yellow-50',
  ringing: 'text-blue-600 bg-blue-50',
  active: 'text-green-600 bg-green-50',
  on_hold: 'text-orange-600 bg-orange-50',
  completed: 'text-gray-600 bg-gray-50',
  missed: 'text-red-600 bg-red-50',
  transferred: 'text-purple-600 bg-purple-50',
}
