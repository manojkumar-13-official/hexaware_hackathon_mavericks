import apiClient from './client'
import type { ApiResponse, Complaint, ComplaintFilters, NewComplaintForm, PaginationMeta } from '@/types'

// ----------------------------------------------------------
// COMPLAINTS API STUBS
// BACKEND_HOOK: Spring Boot /api/complaints
// ----------------------------------------------------------

export const complaintsApi = {
  /**
   * BACKEND_HOOK: GET /api/complaints
   * Query params: page, pageSize, status, category, department, search, etc.
   */
  list: (filters?: ComplaintFilters) =>
    apiClient.get<ApiResponse<Complaint[]> & { meta: PaginationMeta }>('/complaints', { params: filters }),

  /**
   * BACKEND_HOOK: GET /api/complaints/:id
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Complaint>>(`/complaints/${id}`),

  /**
   * BACKEND_HOOK: POST /api/complaints
   * Body: NewComplaintForm (multipart/form-data if attachments included)
   */
  create: (form: NewComplaintForm) => {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'attachments' && Array.isArray(value)) {
        value.forEach((file: File) => formData.append('attachments', file))
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    return apiClient.post<ApiResponse<Complaint>>('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * BACKEND_HOOK: PUT /api/complaints/:id
   */
  update: (id: string, data: Partial<Complaint>) =>
    apiClient.put<ApiResponse<Complaint>>(`/complaints/${id}`, data),

  /**
   * BACKEND_HOOK: PATCH /api/complaints/:id/status
   */
  updateStatus: (id: string, status: string, note?: string) =>
    apiClient.patch<ApiResponse<Complaint>>(`/complaints/${id}/status`, { status, note }),

  /**
   * BACKEND_HOOK: PATCH /api/complaints/:id/assign
   */
  assign: (id: string, officerId: string) =>
    apiClient.patch<ApiResponse<Complaint>>(`/complaints/${id}/assign`, { officerId }),

  /**
   * BACKEND_HOOK: POST /api/complaints/:id/feedback
   */
  submitFeedback: (id: string, rating: number, note?: string) =>
    apiClient.post<ApiResponse<void>>(`/complaints/${id}/feedback`, { rating, note }),

  /**
   * BACKEND_HOOK: GET /api/complaints/citizen/:citizenId
   * Citizen's own complaint history
   */
  getMyCcomplaints: (citizenId: string, filters?: ComplaintFilters) =>
    apiClient.get<ApiResponse<Complaint[]>>(`/complaints/citizen/${citizenId}`, { params: filters }),

  /**
   * BACKEND_HOOK: GET /api/complaints/track/:referenceNumber
   * Public endpoint — no auth required
   */
  trackByReference: (referenceNumber: string) =>
    apiClient.get<ApiResponse<Complaint>>(`/complaints/track/${referenceNumber}`),
}
