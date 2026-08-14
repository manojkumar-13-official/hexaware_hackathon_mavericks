import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Phone, Shield, Settings, Users,
  BarChart3, HelpCircle, ChevronLeft, ChevronRight, LogOut,
  PlusCircle, History, User, AlertTriangle, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts'
import { useAppSettings } from '@/contexts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  roles: UserRole[]
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  // Public / Shared
  { label: 'Home', icon: Home, to: '/', roles: ['citizen', 'call_center', 'officer', 'admin'], exact: true },

  // Citizen
  { label: 'My Dashboard', icon: LayoutDashboard, to: '/citizen', roles: ['citizen'], exact: true },
  { label: 'New Complaint', icon: PlusCircle, to: '/citizen/new', roles: ['citizen'] },
  { label: 'My Complaints', icon: History, to: '/citizen/history', roles: ['citizen'] },
  { label: 'My Profile', icon: User, to: '/citizen/profile', roles: ['citizen'] },

  // Call Center
  { label: 'Call Center', icon: Phone, to: '/call-center', roles: ['call_center'] },

  // Officer
  { label: 'Officer Dashboard', icon: Shield, to: '/officer', roles: ['officer'], exact: true },

  // Admin
  { label: 'Admin Dashboard', icon: LayoutDashboard, to: '/admin', roles: ['admin'], exact: true },
  { label: 'Analytics', icon: BarChart3, to: '/admin/analytics', roles: ['admin'] },
  { label: 'Users', icon: Users, to: '/admin/users', roles: ['admin'] },
  { label: 'Settings', icon: Settings, to: '/admin/settings', roles: ['admin'] },

  // Shared bottom
  { label: 'Reports', icon: FileText, to: '/admin/analytics', roles: ['officer'] },
  { label: 'Escalations', icon: AlertTriangle, to: '/officer', roles: ['officer'] },
  { label: 'Help', icon: HelpCircle, to: '/help', roles: ['citizen', 'call_center', 'officer', 'admin'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { settings, toggleSidebar } = useAppSettings()
  const location = useLocation()
  const collapsed = settings.sidebarCollapsed

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-gray-900 text-white transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-700 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-white leading-tight">GovConnect</p>
            <p className="text-xs text-gray-400 leading-tight">Call Intelligence</p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-gray-300" />
          : <ChevronLeft className="w-3 h-3 text-gray-300" />
        }
      </button>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)

          const linkEl = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return linkEl
        })}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-gray-700 p-3 shrink-0', collapsed ? 'flex flex-col items-center gap-2' : '')}>
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'gap-3 mb-2')}>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        )}
      </div>
    </aside>
  )
}
