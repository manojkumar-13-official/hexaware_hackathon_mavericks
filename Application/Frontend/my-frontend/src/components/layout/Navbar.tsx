import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Settings, Moon, Sun, Menu } from 'lucide-react'
import { cn, getInitials, timeAgo } from '@/lib/utils'
import { useAuth } from '@/contexts'
import { useNotifications } from '@/contexts'
import { useAppSettings } from '@/contexts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavbarProps {
  title?: string
}

export function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { settings, toggleSidebar, setTheme } = useAppSettings()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // BACKEND_HOOK: implement global search — navigate to search results page
    if (searchValue.trim()) {
      navigate(`/track-complaint?ref=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 z-20">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Page title */}
      {title && (
        <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h1>
      )}

      {/* Global search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md" role="search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search complaints, reference no…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className={cn(
              'w-full pl-9 pr-4 h-9 rounded-md border border-gray-300 bg-gray-50',
              'text-sm placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500'
            )}
            aria-label="Search"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unreadCount} unread)`}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-2">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:underline focus:outline-none"
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {recentNotifications.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-gray-400">No notifications</div>
            ) : (
              recentNotifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id)
                    if (n.link) navigate(n.link)
                  }}
                  className={cn('flex-col items-start gap-0.5 py-2', !n.isRead && 'bg-blue-50')}
                >
                  <div className="flex items-center gap-2 w-full">
                    {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" aria-label="Unread" />}
                    <span className={cn('text-sm font-medium text-gray-900 flex-1', n.isRead && 'ml-4')}>
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4 line-clamp-1">{n.message}</p>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-blue-600 text-sm font-medium">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="User menu"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/citizen/profile')}>
                <Settings className="w-4 h-4" />
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={logout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
