import apiClient from './client'
import type { ApiResponse, User, ProfileUpdateForm } from '@/types'

// ----------------------------------------------------------
// USERS API STUBS
// BACKEND_HOOK: Spring Boot /api/users (admin-scoped)
// ----------------------------------------------------------

export const usersApi = {
  /**
   * BACKEND_HOOK: GET /api/users
   * Admin only — list all users with pagination
   */
  list: (params?: { role?: string; page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<ApiResponse<User[]>>('/users', { params }),

  /**
   * BACKEND_HOOK: GET /api/users/:id
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  /**
   * BACKEND_HOOK: PUT /api/users/:id
   */
  update: (id: string, data: ProfileUpdateForm) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  /**
   * BACKEND_HOOK: PATCH /api/users/:id/role
   * Admin only
   */
  updateRole: (id: string, role: string) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/role`, { role }),

  /**
   * BACKEND_HOOK: PATCH /api/users/:id/status
   * Admin only — activate/deactivate user
   */
  updateStatus: (id: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { isActive }),

  /**
   * BACKEND_HOOK: POST /api/users
   * Admin only — create new user (officer, agent, admin)
   */
  create: (data: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password: string }) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  /**
   * BACKEND_HOOK: DELETE /api/users/:id
   * Admin only — soft delete
   */
  remove: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/users/${id}`),

  /**
   * BACKEND_HOOK: PUT /api/users/me/profile
   * Update own profile
   */
  updateMyProfile: (data: ProfileUpdateForm) =>
    apiClient.put<ApiResponse<User>>('/users/me/profile', data),

  /**
   * BACKEND_HOOK: POST /api/users/me/avatar
   * Upload profile picture (multipart/form-data)
   */
  uploadAvatar: (file: File) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return apiClient.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
