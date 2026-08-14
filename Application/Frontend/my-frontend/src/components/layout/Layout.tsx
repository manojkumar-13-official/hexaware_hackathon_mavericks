import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { cn } from '@/lib/utils'
import { useAppSettings } from '@/contexts'

interface LayoutProps {
  title?: string
  children?: React.ReactNode
}

/**
 * Main authenticated layout — collapsible sidebar + top navbar + scrollable content area.
 * Uses CSS grid: sidebar | [navbar / content]
 */
export function Layout({ title, children }: LayoutProps) {
  const { settings } = useAppSettings()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar title={title} />

        {/* Scrollable page content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto p-6',
            settings.density === 'compact' && 'p-3',
            settings.density === 'comfortable' && 'p-8'
          )}
          id="main-content"
          tabIndex={-1}
        >
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

/**
 * Public layout — no sidebar, minimal header with logo.
 */
export function PublicLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Slim public header */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-3">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">G</span>
        </div>
        <span className="font-semibold text-gray-900">GovConnect</span>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <a href="/track-complaint" className="text-gray-600 hover:text-blue-600 transition-colors">Track Complaint</a>
          <a href="/help" className="text-gray-600 hover:text-blue-600 transition-colors">Help</a>
          <a
            href="/login"
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Login
          </a>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
