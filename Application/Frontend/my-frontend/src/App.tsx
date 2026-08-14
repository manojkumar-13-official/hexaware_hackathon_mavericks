import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { AuthProvider, NotificationProvider, AppProvider } from '@/contexts'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * Root application component.
 *
 * Provider order (outer → inner):
 *   AppProvider        — UI settings, theme, sidebar state
 *   AuthProvider       — JWT auth, user session
 *   NotificationProvider — in-app notifications (+ WebSocket hook stub)
 *   TooltipProvider    — Radix UI tooltip root
 *   RouterProvider     — React Router v7 with all routes & guards
 *   Toaster            — Sonner toast notifications
 */
export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider delayDuration={300}>
            {/* Skip-to-main for keyboard accessibility */}
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>

            <RouterProvider router={router} />

            {/* Sonner toast container */}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                style: {
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                },
              }}
            />
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </AppProvider>
  )
}
