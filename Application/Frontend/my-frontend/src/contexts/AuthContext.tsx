import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { User, AuthState, AuthTokens, LoginCredentials } from '@/types'

// ----------------------------------------------------------
// AUTH CONTEXT
// Manages JWT auth state; swap mock functions with real API calls
// ----------------------------------------------------------

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'AUTH_FAILURE':
      return { ...initialState, isLoading: false }
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false }
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Storage helpers
const TOKEN_KEY = 'govconnect_tokens'
const USER_KEY = 'govconnect_user'

function saveSession(user: User, tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const rawTokens = localStorage.getItem(TOKEN_KEY)
      const rawUser = localStorage.getItem(USER_KEY)
      if (rawTokens && rawUser) {
        const tokens: AuthTokens = JSON.parse(rawTokens)
        const user: User = JSON.parse(rawUser)
        // BACKEND_HOOK: Validate token expiry; call /auth/refresh if expired
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } })
      } else {
        dispatch({ type: 'AUTH_FAILURE' })
      }
    } catch {
      dispatch({ type: 'AUTH_FAILURE' })
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' })
    try {
      // BACKEND_HOOK: Replace with real API call
      // const response = await authApi.login(credentials)
      // const { user, tokens } = response.data

      // --- MOCK LOGIN (remove when backend is ready) ---
      const { mockLogin } = await import('@/mock/authMock')
      const { user, tokens } = await mockLogin(credentials)
      // --- END MOCK ---

      saveSession(user, tokens)
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } })
    } catch (err) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    // BACKEND_HOOK: Call POST /auth/logout to invalidate refresh token server-side
    clearSession()
    dispatch({ type: 'AUTH_LOGOUT' })
  }, [])

  const refreshToken = useCallback(async () => {
    // BACKEND_HOOK: Call POST /auth/refresh with stored refreshToken
    // const response = await authApi.refresh(state.tokens?.refreshToken)
    // saveSession(state.user!, response.data.tokens)
    console.warn('refreshToken: not implemented – connect to BACKEND_HOOK')
  }, [])

  const updateUser = useCallback((partial: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: partial })
    if (state.user) {
      localStorage.setItem(USER_KEY, JSON.stringify({ ...state.user, ...partial }))
    }
  }, [state.user])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
