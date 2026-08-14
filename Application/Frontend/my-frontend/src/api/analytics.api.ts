import apiClient from './client'
import type { ApiResponse, AnalyticsSummary, DepartmentStat, TrendDataPoint, CategoryBreakdown, SentimentTrend, OfficerStats } from '@/types'

// ----------------------------------------------------------
// ANALYTICS API STUBS
// BACKEND_HOOK: Spring Boot /api/analytics
// AI_HOOK: Some endpoints aggregate AI microservice data
// ----------------------------------------------------------

export const analyticsApi = {
  /**
   * BACKEND_HOOK: GET /api/analytics/summary
   * High-level KPI summary for dashboard
   */
  getSummary: () =>
    apiClient.get<ApiResponse<AnalyticsSummary>>('/analytics/summary'),

  /**
   * BACKEND_HOOK: GET /api/analytics/departments
   * Complaint counts broken down by department
   */
  getDepartmentStats: (dateFrom?: string, dateTo?: string) =>
    apiClient.get<ApiResponse<DepartmentStat[]>>('/analytics/departments', { params: { dateFrom, dateTo } }),

  /**
   * BACKEND_HOOK: GET /api/analytics/trends
   * Daily resolution trend data
   */
  getTrends: (days = 7) =>
    apiClient.get<ApiResponse<TrendDataPoint[]>>('/analytics/trends', { params: { days } }),

  /**
   * BACKEND_HOOK: GET /api/analytics/categories
   * Category breakdown for pie/donut chart
   */
  getCategoryBreakdown: () =>
    apiClient.get<ApiResponse<CategoryBreakdown[]>>('/analytics/categories'),

  /**
   * BACKEND_HOOK: GET /api/analytics/sentiment
   * AI_HOOK: Aggregated sentiment from NLP microservice
   */
  getSentimentTrend: (days = 7) =>
    apiClient.get<ApiResponse<SentimentTrend[]>>('/analytics/sentiment', { params: { days } }),

  /**
   * BACKEND_HOOK: GET /api/analytics/officers
   * Per-officer performance stats
   */
  getOfficerStats: () =>
    apiClient.get<ApiResponse<OfficerStats[]>>('/analytics/officers'),

  /**
   * BACKEND_HOOK: GET /api/analytics/export?format=csv|pdf
   * Trigger report export
   */
  exportReport: (format: 'csv' | 'pdf', dateFrom?: string, dateTo?: string) =>
    apiClient.get('/analytics/export', {
      params: { format, dateFrom, dateTo },
      responseType: 'blob',
    }),
}
