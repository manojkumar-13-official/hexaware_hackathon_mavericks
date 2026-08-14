import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import type { Notification, NotificationType } from '@/types'

// ----------------------------------------------------------
// NOTIFICATION CONTEXT
// Manages in-app notifications; extends to WebSocket push later
// ----------------------------------------------------------

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

type NotificationAction =
  | { type: 'ADD'; payload: Notification }
  | { type: 'MARK_READ'; id: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'LOAD'; payload: Notification[] }

function notificationReducer(state: Notification[], action: NotificationAction): Notification[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload
    case 'ADD':
      return [action.payload, ...state]
    case 'MARK_READ':
      return state.map(n => n.id === action.id ? { ...n, isRead: true } : n)
    case 'MARK_ALL_READ':
      return state.map(n => ({ ...n, isRead: true }))
    case 'REMOVE':
      return state.filter(n => n.id !== action.id)
    case 'CLEAR_ALL':
      return []
    default:
      return state
  }
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const STORAGE_KEY = 'govconnect_notifications'

let idCounter = Date.now()
function generateId() {
  return `notif_${++idCounter}`
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, dispatch] = useReducer(notificationReducer, [])
  // WEBSOCKET_HOOK: store WebSocket ref for cleanup
  const wsRef = useRef<WebSocket | null>(null)

  // Load persisted notifications
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'LOAD', payload: JSON.parse(raw) })
    } catch {
      // ignore parse errors
    }
  }, [])

  // Persist notifications to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)))
  }, [notifications])

  // WEBSOCKET_HOOK: Connect to Spring Boot WebSocket for push notifications
  // Uncomment and configure when backend is ready
  // useEffect(() => {
  //   const token = getAccessToken()
  //   const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/notifications?token=${token}`)
  //   wsRef.current = ws
  //   ws.onmessage = (event) => {
  //     const notification: Notification = JSON.parse(event.data)
  //     dispatch({ type: 'ADD', payload: notification })
  //   }
  //   ws.onerror = () => console.error('Notification WebSocket error')
  //   return () => ws.close()
  // }, [])

  const addNotification = useCallback((
    n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>
  ) => {
    dispatch({
      type: 'ADD',
      payload: {
        ...n,
        id: generateId(),
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    })
  }, [])

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_READ', id })
  }, [])

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' })
  }, [])

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Suppress unused ref warning in development
  void wsRef

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

// Helper to fire typed notifications quickly from anywhere
export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Omit<Notification, 'id' | 'isRead' | 'createdAt'> {
  return { type, title, message, link }
}
