import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

// ----------------------------------------------------------
// APP SETTINGS CONTEXT
// Global UI preferences: sidebar, theme, density, language
// ----------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system'
export type Density = 'compact' | 'default' | 'comfortable'
export type AppLanguage = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'bn'

export interface AppSettings {
  theme: Theme
  density: Density
  language: AppLanguage
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  highContrast: boolean
  reducedMotion: boolean
  notifications: {
    sound: boolean
    desktop: boolean
    email: boolean
  }
}

interface AppContextValue {
  settings: AppSettings
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setTheme: (v: Theme) => void
  setDensity: (v: Density) => void
  setLanguage: (v: AppLanguage) => void
  setHighContrast: (v: boolean) => void
  updateSettings: (partial: Partial<AppSettings>) => void
}

type AppAction =
  | { type: 'UPDATE'; payload: Partial<AppSettings> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'LOAD'; payload: AppSettings }

const defaultSettings: AppSettings = {
  theme: 'light',
  density: 'default',
  language: 'en',
  sidebarCollapsed: false,
  sidebarPinned: true,
  highContrast: false,
  reducedMotion: false,
  notifications: {
    sound: true,
    desktop: false,
    email: true,
  },
}

function appReducer(state: AppSettings, action: AppAction): AppSettings {
  switch (action.type) {
    case 'LOAD':
      return { ...defaultSettings, ...action.payload }
    case 'UPDATE':
      return { ...state, ...action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    default:
      return state
  }
}

const AppContext = createContext<AppContextValue | null>(null)
const STORAGE_KEY = 'govconnect_settings'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, dispatch] = useReducer(appReducer, defaultSettings)

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'LOAD', payload: JSON.parse(raw) })
    } catch {
      // use defaults
    }
  }, [])

  // Persist settings on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)

    root.classList.toggle('dark', isDark)
    root.classList.toggle('high-contrast', settings.highContrast)

    if (settings.reducedMotion) {
      root.style.setProperty('--motion-duration', '0ms')
    } else {
      root.style.removeProperty('--motion-duration')
    }
  }, [settings.theme, settings.highContrast, settings.reducedMotion])

  const setSidebarCollapsed = useCallback((v: boolean) => {
    dispatch({ type: 'UPDATE', payload: { sidebarCollapsed: v } })
  }, [])

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }, [])

  const setTheme = useCallback((v: Theme) => {
    dispatch({ type: 'UPDATE', payload: { theme: v } })
  }, [])

  const setDensity = useCallback((v: Density) => {
    dispatch({ type: 'UPDATE', payload: { density: v } })
  }, [])

  const setLanguage = useCallback((v: AppLanguage) => {
    dispatch({ type: 'UPDATE', payload: { language: v } })
  }, [])

  const setHighContrast = useCallback((v: boolean) => {
    dispatch({ type: 'UPDATE', payload: { highContrast: v } })
  }, [])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE', payload: partial })
  }, [])

  return (
    <AppContext.Provider value={{
      settings,
      setSidebarCollapsed,
      toggleSidebar,
      setTheme,
      setDensity,
      setLanguage,
      setHighContrast,
      updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppSettings(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppSettings must be used within AppProvider')
  return ctx
}
