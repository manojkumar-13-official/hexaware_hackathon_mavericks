import apiClient from './client'
import type { ApiResponse, AuthTokens, User, LoginCredentials } from '@/types'

// ----------------------------------------------------------
// AUTH API STUBS
// BACKEND_HOOK: Connect to Spring Boot /api/auth endpoints
// ----------------------------------------------------------

export const authApi = {
  /**
   * BACKEND_HOOK: POST /api/auth/login
   * Body: { email, password }
   * Returns: { user: User, tokens: AuthTokens }
   */
  login: (credentials: LoginCredentials) =>
    apiClient.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials),

  /**
   * BACKEND_HOOK: POST /api/auth/logout
   * Body: { refreshToken }
   * Invalidates session server-side
   */
  logout: (refreshToken: string) =>
    apiClient.post<ApiResponse<void>>('/auth/logout', { refreshToken }),

  /**
   * BACKEND_HOOK: POST /api/auth/refresh
   * Body: { refreshToken }
   * Returns: { tokens: AuthTokens }
   */
  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', { refreshToken }),

  /**
   * BACKEND_HOOK: GET /api/auth/me
   * Returns: current authenticated user
   */
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),

  /**
   * BACKEND_HOOK: POST /api/auth/forgot-password
   * Body: { email }
   */
  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email }),

  /**
   * BACKEND_HOOK: POST /api/auth/reset-password
   * Body: { token, newPassword }
   */
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<ApiResponse<void>>('/auth/reset-password', { token, newPassword }),
}
